"""Offline test of France's relay answers (scripts/railroads/sncf.py and its
Worker twin, relay/feeds/sncf.js) and of the page's use of them
(js/railroads/sncf.js): no key, no network.

    python3 scripts/test_sncf.py

1. Three GTFS-Realtime feeds, encoded here as the real ones come (October
   2026): SNCF's (trip ids "OCESN<number>F...", stop ids
   "StopPoint:OCE<kind>-<UIC with check digit>", delays with times, a
   cancelled trip, an added one), Eurostar's (trip ids "<number>-<MMDD>",
   platforms "paris_nord_12", NO_DATA stops) and ZOU!'s (trip ids
   "<number>@<date>", UIC stop ids, times only): both twins give the same
   JSON, the added trip and other days' trips left out, a negative delay
   kept.
2. A PRIM SIRI Lite estimated-timetable answer (as PRIM documents it: Siri.
   ServiceDelivery.EstimatedTimetableDelivery[].EstimatedJourneyVersionFrame[].
   EstimatedVehicleJourney[]): both twins agree.
3. The page's shift of a timetabled run by each kind of trip.
Needs node on the PATH."""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from railroads import sncf  # noqa: E402


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


def event(delay=None, t=None):
    return (field(1, delay) if delay is not None else b"") + (field(2, t) if t is not None else b"")


def stop(seq, stop_id, arr=None, dep=None, relationship=0):
    body = field(1, seq) + field(4, stop_id)
    if arr is not None:
        body += field(2, event(*arr))
    if dep is not None:
        body += field(3, event(*dep))
    if relationship:
        body += field(5, relationship)
    return field(2, body)


def trip(entity_id, trip_id, date, stops=(), relationship=0, start="12:00:00"):
    desc = field(1, trip_id) + field(2, start) + field(3, date) + (field(4, relationship) if relationship else b"")
    return field(2, field(1, entity_id) + field(3, field(1, desc) + b"".join(stops)))


T = 1792850000  # 2026-10-24 ~ 14:33 Paris
SNCF = (field(1, field(1, "1.0") + field(3, T))
        # TGV 6611: on time from Paris Gare de Lyon, 5 min late from Dijon, 2 min early at Lyon.
        + trip("1", "OCESN6611F1187_F:OUI:x", "20261024",
               [stop(0, "StopPoint:OCETGV INOUI-87686006", None, (0, T)),
                stop(1, "StopPoint:OCETGV INOUI-87713040", (300, T + 6000), (300, T + 6120)),
                stop(2, "StopPoint:OCETGV INOUI-87723197", (-120, T + 9000), None)])
        # A TER cancelled, its stops skipped.
        + trip("2", "OCESN865101F1187_F:TER:y", "20261024",
               [stop(0, "StopPoint:OCETrain TER-87713040", None, (0, T), 1),
                stop(1, "StopPoint:OCETrain TER-87713412", (0, T + 600), None, 1)], 3)
        # An added trip: left out.
        + trip("3", "OCESN999F1187_F:TER:z", "20261024", [stop(0, "StopPoint:OCETrain TER-87713040", None, (0, T))], 1)
        # Yesterday's night train still running, and a trip of next week: kept, left out.
        + trip("4", "OCESN5772F1187_F:ICN:w", "20261023", [stop(5, "StopPoint:OCEINTERCITES de nuit-87756056", (600, T), (600, T))])
        + trip("5", "OCESN5773F1187_F:ICN:v", "20261031", [stop(5, "StopPoint:OCEINTERCITES de nuit-87756056", (600, T), (600, T))]))
EUROSTAR = (field(1, field(1, "2.0") + field(3, T + 30))
            # 9014: a platform only (NO_DATA): nothing; 9023: 4 min late at Paris Nord.
            + trip("a", "9014-1024", "20261024", [stop(1, "st_pancras_international_6", relationship=2)])
            + trip("b", "9023-1024", "20261024", [stop(2, "paris_nord_12", (240, T + 100), (240, T + 100))]))
ZOU = (field(1, field(1, "2.0") + field(3, T - 30))
       + trip("z", "17489@2026-10-24", "20261024",
              [stop(1, "87751008", None, (None, T + 120)), stop(2, "87755009", (None, T + 2760), (None, T + 2940))]))

WANT = {"at": T + 30, "trips": {
    "17489": [["20261024", 0, 1, [[8775100, T + 120, T + 120, 0], [8775500, T + 2760, T + 2940, 0]]]],
    "5772": [["20261023", 0, 0, [[8775605, 600, 600, 0]]]],
    "6611": [["20261024", 0, 0, [[8768600, 0, 0, 0], [8771304, 300, 300, 0], [8772319, -120, -120, 0]]]],
    "865101": [["20261024", 1, 0, [[8771304, 0, 0, 1]]]],
    "9023": [["20261024", 0, 0, [[8727100, 240, 240, 0]]]]}}

SIRI = {"Siri": {"ServiceDelivery": {"ResponseTimestamp": "2026-10-24T12:33:20.000Z", "EstimatedTimetableDelivery": [
    {"EstimatedJourneyVersionFrame": [{"EstimatedVehicleJourney": [
        {"LineRef": {"value": "STIF:Line::C01742:"}, "DatedVehicleJourneyRef": {"value": "SNCF_ACCES_CLOUD:VehicleJourney::UPAC97_20261024"},
         "TrainNumbers": {"TrainNumberRef": [{"value": "UPAC97"}, {"value": "123456"}]},
         "EstimatedCalls": {"EstimatedCall": [
             {"StopPointRef": {"value": "STIF:StopPoint:Q:41087:"}, "AimedDepartureTime": "2026-10-24T12:40:00.000Z",
              "ExpectedDepartureTime": "2026-10-24T12:42:00.000Z", "DepartureStatus": "delayed"},
             {"StopPointRef": {"value": "STIF:StopPoint:Q:41088:"}, "AimedArrivalTime": "2026-10-24T12:45:00.000Z",
              "ExpectedArrivalTime": "2026-10-24T12:47:00.000Z", "AimedDepartureTime": "2026-10-24T12:45:30.000Z",
              "ExpectedDepartureTime": "2026-10-24T12:47:30.000Z"},
             {"StopPointRef": {"value": "STIF:StopPoint:Q:41089:"}, "AimedArrivalTime": "2026-10-24T12:50:00.000Z",
              "ArrivalStatus": "cancelled"}]}}]}]}]}}}
WANT_SIRI = {"at": 1792845200, "trips": {"123456": [["", 0, 2, [[1792845600, 120, 120, 0], [1792846200, 0, 0, 1]]]]}}

NODE = """
import { compact, compactSiri } from "./relay/feeds/sncf.js";
import { readFileSync } from "node:fs";
const src = readFileSync("js/railroads/sncf.js", "utf8").replace(/^import .*$/m, "const timetableTrains = null;");
const { shifted } = await import("data:text/javascript," + encodeURIComponent(src));
const i = JSON.parse(process.argv[1]);
const feed = (s) => Uint8Array.from(Buffer.from(s, "base64"));
console.log(JSON.stringify({ compact: compact(i.feeds.map(feed)), siri: compactSiri([i.siri]),
  shifted: i.trips.map((t) => shifted(i.stops, t, i.now)) }));
"""


def main():
    import base64
    py = sncf.compact([SNCF, EUROSTAR, ZOU])
    assert py == WANT, json.dumps(py)
    siri = sncf.compact_siri([SIRI])
    assert siri == WANT_SIRI, json.dumps(siri)
    # A run of three stops: Paris Gare de Lyon, Dijon Ville, Lyon Part Dieu.
    stops = [{"stopId": u, "arrival": {"time": T + m}, "departure": {"time": T + m + d}, "scheduled": T + m + d}
             for u, m, d in (("8768600", 0, 0), ("8771304", 5700, 120), ("8772319", 9120, 0))]
    trips = [{"cancelled": False, "kind": 0, "stops": WANT["trips"]["6611"][0][3]},
             {"cancelled": False, "kind": 1, "stops": [[8768600, T + 60, T + 60, 0], [8772319, T + 9300, T + 9300, 0]]},
             {"cancelled": False, "kind": 2, "stops": [[T + 5820, 180, 180, 0]]}]
    inp = {"feeds": [base64.b64encode(f).decode() for f in (SNCF, EUROSTAR, ZOU)], "siri": SIRI, "stops": stops,
           "trips": trips, "now": T + 6000}
    out = subprocess.run(["node", "--input-type=module", "-e", NODE, json.dumps(inp)], cwd=ROOT, capture_output=True, text=True)
    assert out.returncode == 0, out.stderr
    js = json.loads(out.stdout)
    dump = lambda x: json.dumps(x, separators=(",", ":"))
    assert dump(js["compact"]) == dump(py), js["compact"]
    assert dump(js["siri"]) == dump(siri), js["siri"]
    print("compact and SIRI: Python and Worker agree")
    late = [[s["arrival"]["time"] - x["arrival"]["time"] for s, x in zip(sh["stops"], stops)] for sh in js["shifted"]]
    # Delays as given, 5 min at Dijon; predicted times, 1 min late at Paris
    # holding through Dijon, 3 at Lyon; timetabled time of Dijon's departure, 3 min from there.
    assert late == [[0, 300, -120], [60, 60, 180], [180, 180, 180]], late
    assert js["shifted"][0]["delay"] == 5, js["shifted"][0]
    print("shifted runs:", late)
    print("ok")


if __name__ == "__main__":
    main()
