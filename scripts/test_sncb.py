"""Offline test of SNCB's detail source (scripts/railroads/sncb.py's iRail
answer and its Worker twin, relay/feeds/sncb.js): no network.

    python3 scripts/test_sncb.py

An iRail vehicle answer and composition answer, cut down from real ones
(IC 2204 Bruxelles-Midi - Brussels Airport, 24 October 2026; a late run and
a cancelled stop added): both twins give the same detail, Brussels' names
French first, Luxembourg as CFL signs it, times as iRail's plus their
delays where the train has been, the composition's vehicles in order.
Needs node on the PATH."""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from railroads import sncb  # noqa: E402


def stop(name, standard, sched, arr_delay="0", dep_delay="0", arrived="0", left="0", platform="?", canceled="0"):
    return {"station": name, "stationinfo": {"name": name, "standardname": standard},
            "scheduledArrivalTime": str(sched), "scheduledDepartureTime": str(sched + 60), "arrivalDelay": arr_delay,
            "departureDelay": dep_delay, "arrived": arrived, "left": left, "canceled": canceled,
            "arrivalCanceled": canceled, "departureCanceled": canceled, "platforminfo": {"name": platform, "normal": "1"}}


VEHICLE = {"vehicleinfo": {"shortname": "IC 2204", "number": "2204", "type": "IC"},
           "stops": {"number": "4", "stop": [
               stop("Brussels-South/Brussels-Midi", "Brussel-Zuid/Bruxelles-Midi", 1792813140, "0", "120", "1", "1", "11"),
               stop("Brussels-Central", "Brussel-Centraal/Bruxelles-Central", 1792813440, "180", "240", "1", "0", "3"),
               stop("Brussels-North", "Brussel-Noord/Bruxelles-Nord", 1792813800, canceled="1"),
               stop("Lëtzebuerg", "Lëtzebuerg", 1792814580, "240", "240")]}}


def unit(parent, sub, side, number, pos, first, second, name=True):
    u = {"materialType": {"parent_type": parent, "sub_type": sub, "orientation": side}, "materialNumber": number,
         "tractionPosition": str(pos), "seatsFirstClass": str(first), "seatsSecondClass": str(second), "lengthInMeter": "25"}
    if name:
        u["materialSubTypeName"] = f"{parent}_{sub}" if sub else parent
    return u


COMPOSITION = {"composition": {"segments": {"number": "1", "segment": [{"origin": {"name": "Brussels-South/Brussels-Midi"},
    "destination": {"name": "Brussels Airport - Zaventem"}, "composition": {"source": "IDA", "units": {"number": "5", "unit": [
        unit("HLE18", "", "LEFT", "1814", 1, 0, 0),
        unit("AM80M", "c", "LEFT", "387", 2, 32, 40), unit("AM80M", "b", "LEFT", "387", 2, 0, 77),
        unit("AM80M", "a", "RIGHT", "387", 2, 0, 99), unit("AM08P", "c", "LEFT", None, 3, 16, 74, name=False)]}}}]}}}

WANT = {
    "found": True, "number": "2204", "date": "2026-10-24", "name": "IC 2204",
    "origin": "Bruxelles-Midi / Brussel-Zuid", "destination": "Luxembourg", "delay": 3, "cancelled": False,
    "departed": True, "arrived": False, "last": {"station": "Bruxelles-Central / Brussel-Centraal", "at": 1792813620},
    "stops": [
        {"name": "Bruxelles-Midi / Brussel-Zuid", "arr": None, "dep": 1792813200, "actualArr": None, "actualDep": 1792813320,
         "platform": "11", "cancelled": False},
        {"name": "Bruxelles-Central / Brussel-Centraal", "arr": 1792813440, "dep": 1792813500, "actualArr": 1792813620,
         "actualDep": None, "platform": "3", "cancelled": False},
        {"name": "Bruxelles-Nord / Brussel-Noord", "arr": 1792813800, "dep": 1792813860, "actualArr": None, "actualDep": None,
         "platform": None, "cancelled": True},
        {"name": "Luxembourg", "arr": 1792814580, "dep": None, "actualArr": None, "actualDep": None, "platform": None,
         "cancelled": False}],
    "cars": {"numbers": ["1814", "387", "387", "387", ""], "models": ["HLE18", "AM80M_c", "AM80M_b", "AM80M_a", "AM08P_c"],
             "classes": ["LK", "12", "2", "2", "12"], "orders": [0, 0, 0, 0, 0], "units": [1, 2, 2, 2, 3],
             "sides": ["LEFT", "LEFT", "LEFT", "RIGHT", "LEFT"], "complete": True}}

NODE = """
import { irailDetail } from "./relay/feeds/sncb.js";
const i = JSON.parse(process.argv[1]);
console.log(JSON.stringify([irailDetail(i.vehicle, i.comp, "2204", "2026-10-24"), irailDetail({ stops: { stop: [] } }, null, "1", "2026-10-24")]));
"""


def main():
    py = sncb.irail_detail(VEHICLE, COMPOSITION, "2204", "2026-10-24")
    assert py == WANT, json.dumps(py, ensure_ascii=False)
    assert sncb.irail_detail({"stops": {"stop": []}}, None, "1", "2026-10-24") == {"found": False}
    out = subprocess.run(["node", "--input-type=module", "-e", NODE, json.dumps({"vehicle": VEHICLE, "comp": COMPOSITION})],
                         cwd=ROOT, capture_output=True, text=True)
    assert out.returncode == 0, out.stderr
    js, none = json.loads(out.stdout)
    dump = lambda x: json.dumps(x, ensure_ascii=False, separators=(",", ":"))
    assert dump(js) == dump(py), dump(js)
    assert none == {"found": False}, none
    print("iRail detail: Python and Worker agree")
    print("ok")


if __name__ == "__main__":
    main()
