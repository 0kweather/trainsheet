"""Offline test of the Netherlands' relay answer (scripts/railroads/nl.py and
its Worker twin, relay/feeds/nl.js) and of the page's use of it
(js/railroads/nl.js): no network.

    python3 scripts/test_nl.py [trainUpdates.pb]

1. A GTFS-Realtime feed, encoded here as OVapi's trainUpdates are (its
   extension 1003 on the TripDescriptor with the train number, and on each
   StopTimeUpdate with the station code and platforms; delays and times):
   both twins give the same JSON, a train on time throughout as one row, an
   added train and a stop with no times left out, a negative delay kept, a
   skipped stop and a cancelled train flagged.
2. Given a saved trainUpdates.pb (gtfs.ovapi.nl/nl/trainUpdates.pb), the
   twins agree on it too.
3. The page's shift of a timetabled run by a trip's updates.
Needs node on the PATH."""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from railroads import nl  # noqa: E402


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


def stop(stop_id, code, arr=None, dep=None, skipped=False, at=1792868040):
    body = b""
    if arr is not None:
        body += field(2, field(1, arr) + field(2, at + arr))
    if dep is not None:
        body += field(3, field(1, dep) + field(2, at + dep))
    body += field(4, stop_id) + field(5, 1 if skipped else 0)
    if code:
        body += field(1003, field(2, "4") + field(4, code))
    return field(2, body)


def trip(trip_id, start, date, number, kind="SPR", stops=(), relationship=0):
    desc = (field(1, trip_id) + field(2, start) + field(3, date) + field(4, relationship) + field(5, "44947") + field(6, 0)
            + field(1003, field(1, f"IFF:{kind}:{number}") + field(2, number)))
    return field(2, field(1, trip_id) + field(3, field(1, desc) + b"".join(stops)))


FEED = (field(1, field(1, "1.0") + field(2, 0) + field(3, 1792817966))
        # Sprinter 4974 on time throughout, a station passed (no times) in between.
        + trip("366487177", "20:54:00", "20261024", "4974",
               stops=[stop("2993986", "ut", None, 0), stop("2994037", "uto", 0, 0), stop("4001960", None),
                      stop("2993189", "hvs", 0, 60)])
        # Intercity 3021 a minute early, then skipping Zaandam, 3 min late on.
        + trip("387621388", "15:27:00", "20261024", "3021", "IC",
               [stop("1", "hdr", None, -60), stop("2", "amr", -60, -60), stop("3", "zd", skipped=True),
                stop("4", "ass", 180, 180), stop("5", "asd", 180, 180)])
        # Cancelled whole, no stops listed.
        + trip("313310745", "13:24:00", "20261024", "31434", relationship=3)
        # An added train (not in the timetable): left out.
        + trip("1", "09:00:00", "20261024", "99001", "IC", [stop("2993986", "ut", None, 0)], 1))

WANT = {"at": 1792817966, "trips": [
    ["20261024", "3021", 0, [["hdr", -60, -60, 0], ["zd", -60, -60, 1], ["ass", 180, 180, 0]]],
    ["20261024", "31434", 1, []],
    ["20261024", "4974", 0, [["ut", 0, 0, 0], ["hvs", 0, 60, 0]]],
]}

# The relay twin as is; the page's parser without its import of
# js/sources.js (which needs a browser), loaded as a data: URL.
NODE = """
import { compact } from "./relay/feeds/nl.js";
import { readFileSync } from "node:fs";
const src = readFileSync("js/railroads/nl.js", "utf8").replace(/^import .*$/m, "const timetableTrains = null;");
const { shifted } = await import("data:text/javascript," + encodeURIComponent(src));
const i = JSON.parse(readFileSync(0, "utf8"));
const out = { compact: compact(Uint8Array.from(Buffer.from(i.feed, "base64"))), shifted: shifted(i.stops, i.trip, i.now) };
if (i.real) out.real = compact(Uint8Array.from(Buffer.from(i.real, "base64")));
console.log(JSON.stringify(out));
"""


def main():
    import base64
    py = nl.compact(FEED)
    assert py == WANT, json.dumps(py)
    real = pathlib.Path(sys.argv[1]).read_bytes() if len(sys.argv) > 1 else None
    # A run of four stops (the timetable's station codes), times in unix
    # seconds, shifted by train 3021's updates.
    day = 1792792800
    stops = [{"stopId": c, "arrival": {"time": day + m * 60}, "departure": {"time": day + m * 60 + 60}, "scheduled": day + m * 60 + 60}
             for c, m in (("hdr", 900), ("amr", 930), ("zd", 950), ("ass", 958), ("asd", 965))]
    inp = {"feed": base64.b64encode(FEED).decode(), "stops": stops, "trip": {"cancelled": False, "stops": WANT["trips"][0][3]},
           "now": day + 940 * 60, **({"real": base64.b64encode(real).decode()} if real else {})}
    out = subprocess.run(["node", "--input-type=module", "-e", NODE], input=json.dumps(inp), cwd=ROOT, capture_output=True, text=True)
    assert out.returncode == 0, out.stderr
    js = json.loads(out.stdout)
    # The twins give the same bytes.
    assert json.dumps(js["compact"], separators=(",", ":")) == json.dumps(py, separators=(",", ":")), js["compact"]
    print("compact: Python and Worker agree")
    if real:
        mine = nl.compact(real)
        assert json.dumps(js["real"], separators=(",", ":")) == json.dumps(mine, separators=(",", ":"))
        print(f"the saved feed: Python and Worker agree ({len(mine['trips'])} trains)")
    # Intercity 3021: a minute early at Den Helder and Alkmaar and through
    # Zaandam, which it skips, 3 min late at Sloterdijk and Amsterdam
    # Centraal (Sloterdijk's update holds on).
    sh = js["shifted"]
    shift = [s["arrival"]["time"] - x["arrival"]["time"] for s, x in zip(sh["stops"], stops)]
    assert shift == [-60, -60, -60, 180, 180], sh
    assert [s["skipped"] for s in sh["stops"]] == [False, False, True, False, False], sh
    assert sh["delay"] == 3, sh
    print("shifted run:", shift, "delay", sh["delay"])
    print("ok")


if __name__ == "__main__":
    main()
