"""Offline test of Switzerland's relay answers (scripts/railroads/switzerland.py
and its Worker twin, relay/feeds/switzerland.js) and of the page's use of
them (js/railroads/switzerland.js): no key, no network.

    python3 scripts/test_switzerland.py

1. A GTFS-Realtime feed, encoded here as opentransportdata.swiss's cookbook
   describes its trip updates (trip_id ".ojp-91-...", start_time, start_date,
   route_id "91-..."; stop ids as SLOIDs; delays only), compacted by both
   twins: the same JSON, the bus trip and the added trip left out, a
   negative delay kept, a skipped stop and a cancelled trip flagged.
2. A Train Formation Service answer (formations_full v2), built from the
   API's OpenAPI description (api-explorer's openapi.template.yaml, v2.0.1:
   formations[].formationVehicles[] with vehicleIdentifier, position,
   number, vehicleProperties; formationsAtScheduledStops[] with
   scheduledStop and formationShort): both twins give the same detail, EVNs
   as 12 digits in position order, a part of an articulated train taking its
   parent's EVN.
3. The page's shift of a timetabled run by a trip's updates.
Needs node on the PATH."""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from railroads import switzerland as ch  # noqa: E402


# ---------- a tiny protobuf writer ----------
def varint(v):
    if v < 0:
        v += 1 << 64
    out = b""
    while True:
        b, v = v & 0x7F, v >> 7
        out += bytes([b | (0x80 if v else 0)])
        if not v:
            return out


def field(n, value):
    if isinstance(value, int):
        return varint(n << 3) + varint(value)
    data = value.encode() if isinstance(value, str) else value
    return varint(n << 3 | 2) + varint(len(data)) + data


def stop(seq, sloid, arr=None, dep=None, skipped=False):
    body = field(1, seq) + field(4, sloid)
    if arr is not None:
        body += field(2, field(1, arr))
    if dep is not None:
        body += field(3, field(1, dep))
    if skipped:
        body += field(5, 1)
    return field(2, body)


def trip(entity_id, trip_id, start, date, route, stops=(), relationship=0):
    desc = field(1, trip_id) + field(2, start) + field(3, date) + (field(4, relationship) if relationship else b"") + field(5, route)
    return field(2, field(1, entity_id) + field(3, field(1, desc) + b"".join(stops)))


FEED = (field(1, field(1, "2.0") + field(3, 1792745000) + field(4, "20261021"))
        # IC 1 on time to Bern, then 1.5 min late from Fribourg on.
        + trip("a", ".ojp-91-1-D.1.TA.5.j26", "12:32:00", "20261023", "91-1-D-j26-1",
               [stop(1, "ch:1:sloid:3000:10:31", None, 0), stop(2, "ch:1:sloid:7000:3:7", 0, 0),
                stop(3, "ch:1:sloid:84014:1:2", 90, 90), stop(4, "ch:1:sloid:4100:1:1", 90, 90)])
        # An S-Bahn running a minute early, then skipping a stop.
        + trip("b", ".ojp-91-12-A.1.TA.77.j26", "06:05:00", "20261023", "91-12-A-j26-1",
               [stop(3, "ch:1:sloid:3006:2:3", -60, -60), stop(4, "ch:1:sloid:3015:0:1", skipped=True),
                stop(5, "ch:1:sloid:3016:0:2", -60, -60)])
        # Cancelled whole, no stops listed.
        + trip("c", ".ojp-91-8-E.1.TA.9.j26", "07:02:00", "20261023", "91-8-E-j26-1", relationship=3)
        # A bus: left out.
        + trip("d", ".ojp-92-206.1.TA.50.j26", "12:41:00", "20261023", "92-206-j26-1", [stop(8, "ch:1:sloid:93932:0:1", 30, 30)])
        # An added trip (no timetable to place it by): left out.
        + trip("e", ".ojp-91-5-A.1.TA.1.j26", "09:00:00", "20261023", "91-5-A-j26-1", [stop(1, "ch:1:sloid:3000:0:1", 0, 0)], 1))

WANT = {"at": 1792745000, "v": "20261021", "trips": [
    ["20261023", "06:05", 0, [[8503006, -60, -60, 0], [8503015, 0, 0, 1], [8503016, -60, -60, 0]]],
    ["20261023", "07:02", 1, []],
    ["20261023", "12:32", 0, [[8503000, 0, 0, 0], [8584014, 90, 90, 0]]],
]}

# A formations_full answer for IC 2806, as the OpenAPI description shapes it:
# a locomotive, a first-class coach, a dining car, and two parts of an
# articulated set (pseudo EVNs "0000...", the set's EVN as parentEvn).
FORMATION = {
    "lastUpdate": "2026-10-23T10:00:00+02:00",
    "journeyMetaInformation": {"SJYID": "ch:1:sjyid:100001:2806-001", "operationDate": "2026-10-23"},
    "trainMetaInformation": {"trainNumber": 2806, "toCode": "11", "runs": "J"},
    "formationsAtScheduledStops": [
        {"scheduledStop": {"stopPoint": {"uic": 8503000, "name": "Zürich HB"}, "stopModifications": 0, "stopType": "H",
                           "stopTime": {"arrivalTime": None, "departureTime": "2026-10-23T12:32:00+02:00"}, "track": "31"},
         "formationShort": {"formationShortString": "@A,[(LK,1:11,WR:12)@B,(2:13,2:14)]", "vehicleGoals": []}},
        {"scheduledStop": {"stopPoint": {"uic": 8500218, "name": "Olten"}, "stopType": "D",
                           "stopTime": {"arrivalTime": None, "departureTime": None}, "track": "N/A"}},
        {"scheduledStop": {"stopPoint": {"uic": 8507000, "name": "Bern"}, "stopType": "H",
                           "stopTime": {"arrivalTime": "2026-10-23T13:28:00+02:00", "departureTime": None}, "track": "N/A"},
         "formationShort": {"formationShortString": "", "vehicleGoals": []}},
    ],
    "formations": [{"metaInformation": {"length": 120.5, "numberVehicles": 5}, "formationVehicles": [
        {"position": 2, "number": 11, "vehicleIdentifier": {"typeCode": 1, "typeCodeName": "Apm61", "evn": "50852070001-3", "parentEvn": ""},
         "vehicleProperties": {"number1class": 54, "number2class": 0}},
        {"position": 1, "number": 0, "vehicleIdentifier": {"typeCode": 2, "typeCodeName": "Re460", "evn": "91854460000-6", "parentEvn": ""},
         "vehicleProperties": {"number1class": 0, "number2class": 0}},
        {"position": 3, "number": 12, "vehicleIdentifier": {"typeCodeName": "WRm", "evn": "61858885000-1"},
         "vehicleProperties": {"numberRestaurantSpace": 40}},
        {"position": 4, "number": 13, "vehicleIdentifier": {"typeCodeName": "RABe515_1", "evn": "00007515005-7", "parentEvn": "94857515005-7"},
         "vehicleProperties": {"number1class": 0, "number2class": 70}},
        {"position": 5, "number": 14, "vehicleIdentifier": {"typeCodeName": "RABe515_1", "evn": "00017515005-7", "parentEvn": "94857515005-7"},
         "vehicleProperties": {"number1class": 12, "number2class": 40}},
    ]}],
}
WANT_FORMATION = {
    "found": True, "formation": True, "number": "2806", "date": "2026-10-23", "evu": "SBBP",
    "cars": {"numbers": ["918544600006", "508520700013", "618588850001", "948575150057", "948575150057"],
             "classes": ["LK", "1", "WR", "2", "12"], "models": ["Re460", "Apm61", "WRm", "RABe515_1", "RABe515_1"],
             "orders": [0, 11, 12, 13, 14], "complete": True},
    "stops": [{"name": "Zürich HB", "uic": 8503000, "arr": None, "dep": 1792751520, "platform": "31", "sectors": "AB"},
              {"name": "Bern", "uic": 8507000, "arr": 1792754880, "dep": None, "platform": None, "sectors": None}]}

# The relay twin as is; the page's parser without its import of
# js/sources.js (which needs a browser), loaded as a data: URL.
NODE = """
import { compact, formation } from "./relay/feeds/switzerland.js";
import { readFileSync } from "node:fs";
const src = readFileSync("js/railroads/switzerland.js", "utf8").replace(/^import .*$/m, "const timetableTrains = null;");
const { shifted } = await import("data:text/javascript," + encodeURIComponent(src));
const i = JSON.parse(process.argv[1]);
console.log(JSON.stringify({ compact: compact(Uint8Array.from(Buffer.from(i.feed, "base64"))),
  formation: formation(i.formation, "2806", "2026-10-23", "SBBP"), shifted: shifted(i.stops, i.trip, i.now) }));
"""


def main():
    import base64
    py = ch.compact(FEED)
    assert py == WANT, json.dumps(py)
    form = ch.formation(FORMATION, "2806", "2026-10-23", "SBBP")
    assert form == WANT_FORMATION, json.dumps(form, ensure_ascii=False)
    # A run of three stops (stop ids as the timetable's, UIC numbers), times
    # in unix seconds, shifted by trip a's updates.
    day = 1792706400
    stops = [{"stopId": u, "arrival": {"time": day + m * 60}, "departure": {"time": day + m * 60 + 120}, "scheduled": day + m * 60 + 120}
             for u, m in (("8503000", 750), ("8507000", 806), ("8504100", 840))]
    want_trip = WANT["trips"][2]
    inp = {"feed": base64.b64encode(FEED).decode(), "formation": FORMATION, "stops": stops,
           "trip": {"cancelled": False, "stops": want_trip[3] + [[8504100, 90, 90, 0]]}, "now": day + 760 * 60}
    out = subprocess.run(["node", "--input-type=module", "-e", NODE, json.dumps(inp)], cwd=ROOT, capture_output=True, text=True)
    assert out.returncode == 0, out.stderr
    js = json.loads(out.stdout)
    # The twins give the same bytes.
    assert json.dumps(js["compact"], separators=(",", ":")) == json.dumps(py, separators=(",", ":")), js["compact"]
    assert json.dumps(js["formation"], ensure_ascii=False, separators=(",", ":")) == \
        json.dumps(form, ensure_ascii=False, separators=(",", ":")), js["formation"]
    print("compact and formation: Python and Worker agree")
    # IC 1 from Zürich HB: on time there, 1.5 min late at Bern (no update
    # names Bern in the compact feed: the update before it, Zürich's, holds
    # until Fribourg's, which the run doesn't stop at) and Neuchâtel.
    sh = js["shifted"]
    assert [s["arrival"]["time"] - x["arrival"]["time"] for s, x in zip(sh["stops"], stops)] == [0, 0, 90], sh
    assert sh["delay"] == 0, sh
    print("shifted run:", [s["arrival"]["time"] - x["arrival"]["time"] for s, x in zip(sh["stops"], stops)], "delay", sh["delay"])
    print("ok")


if __name__ == "__main__":
    main()
