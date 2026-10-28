"""Offline test of Germany's detail source (scripts/railroads/germany.py's
DB Timetables answer and its Worker twin, relay/feeds/germany.js), and of
the page's and relay's asking by station ("detailBy"/"by": "stop"): no
network.

    python3 scripts/test_germany.py

The XML is in the Timetables API's form (DB API Marketplace, timetables/v1:
a station's planned stops for an hour, /plan, and its known changes, /fchg,
joined by stop id), written for this test from the API's documentation and
the answers others have published; no key was at hand to record real ones.
Checked:
  - both twins give the same detail: the ICE matched by its time and category,
    an RE by its category and line (and not the S-Bahn at the same minute),
    the forecast delay and changed platform from /fchg, a cancelled call;
    no train on that line at that minute is {"found": false};
  - caching and the limit, in both twins: two trains at one station in one
    hour ask /plan and /fchg once; /fchg again after 90 s, /plan not; no more
    than 50 requests upstream in a minute;
  - nothing changes for the other detail sources: the relay at c9f0ca3
    (before asking by station) and now asks the same upstream URLs and answers the same for
    iRail's, ViaggiaTreno's and the Swiss formation source's queries, and the
    page builds the same detail URLs for SNCB's, BLS's and SBB's trains (and none for an
    unnumbered one, as before); a Germany train is
    asked for by its next numbered station, time and line.
Needs node and git on the PATH."""
import json, pathlib, shutil, subprocess, sys, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from railroads import germany  # noqa: E402

PLAN = """<?xml version='1.0' encoding='UTF-8'?>
<timetable station="Frankfurt(Main)Hbf">
<s id="-7874571842864554321-2610281412-11"><tl f="F" t="p" o="80" c="ICE" n="1229"/><ar pt="2610281424" pp="7" ppth="Berlin Hbf|Erfurt Hbf|Fulda"/><dp pt="2610281430" pp="7" ppth="Mannheim Hbf|Stuttgart Hbf"/></s>
<s id="5170426512830152123-2610281402-4"><tl f="N" t="p" o="800486" c="RE" n="4513"/><ar pt="2610281427" pp="18" l="30" ppth="Kassel Hbf|Gießen"/><dp pt="2610281432" pp="18" l="30" ppth="Mainz Hbf"/></s>
<s id="-112233445566778899-2610281432-1"><tl f="S" t="p" o="800528" c="S" n="35831"/><dp pt="2610281432" pp="102" l="8" ppth="Frankfurt(Main)Ost|Hanau Hbf"/></s>
<s id="998877-2610281300-9"><tl f="N" t="p" o="800486" c="RB" n="15321"/><ar pt="2610281445" pp="21" l="12" ppth="Königstein(Taunus)"/></s>
</timetable>"""
FCHG = """<?xml version='1.0' encoding='UTF-8'?>
<timetable station="Frankfurt(Main)Hbf" eva="8000105">
<s id="-7874571842864554321-2610281412-11" eva="8000105"><ar ct="2610281431" cp="9"/><dp ct="2610281436" cp="9"/></s>
<s id="5170426512830152123-2610281402-4" eva="8000105"><ar ct="2610281427"/><dp cs="c" clt="2610281200"/></s>
<s id="998877-2610281300-9" eva="8000105"><ar ct="2610281449" cp="20"/></s>
</timetable>"""
Q = lambda time, line: {"train": "0", "date": "2026-10-28", "from": "", "at": "8000105", "time": time, "line": line}
T = lambda hhmm: germany.epoch("26102814" + hhmm)
WANT = [
    {"found": True, "number": "1229", "shownNumber": "1229", "category": "ICE", "date": "2026-10-28", "delay": 6, "cancelled": False,
     "departed": False, "arrived": False, "last": None,
     "stops": [{"name": "Frankfurt(Main)Hbf", "arr": T("24"), "dep": T("30"), "actualArr": None, "actualDep": None, "platform": "9",
                "cancelled": False}]},
    {"found": True, "number": "4513", "shownNumber": "4513", "category": "RE", "date": "2026-10-28", "delay": None, "cancelled": False,
     "departed": False, "arrived": False, "last": None,
     "stops": [{"name": "Frankfurt(Main)Hbf", "arr": T("27"), "dep": T("32"), "actualArr": None, "actualDep": None, "platform": "18",
                "cancelled": False}]},
    {"found": True, "number": "15321", "shownNumber": "15321", "category": "RB", "date": "2026-10-28", "delay": 4, "cancelled": False,
     "departed": False, "arrived": False, "last": None,
     "stops": [{"name": "Frankfurt(Main)Hbf", "arr": T("45"), "dep": None, "actualArr": None, "actualDep": None, "platform": "20",
                "cancelled": False}]},
    {"found": False},
]
QUERIES = [Q("2610281430", "ICE"), Q("2610281432", "RE 30"), Q("2610281445", "RB 12"), Q("2610281430", "RE 30")]
# The RE's departure is cancelled but it arrives: the call isn't cancelled, its delay unknown (no departure forecast).

NODE_DETAIL = """
import { detail, answer, _reset } from "./relay/feeds/germany.js";
const i = JSON.parse(process.argv[1]);
const out = i.queries.map((q) => detail(i.plan, i.fchg, q));
const urls = [];
globalThis.fetch = async (url) => { urls.push(url.replace(/^.*timetables\\/v1/, "")); return new Response(url.includes("/plan/") ? i.plan : i.fchg); };
const env = { DB_CLIENT_ID: "x", DB_API_KEY: "y" };
const t0 = Date.UTC(2026, 9, 28, 13, 20);
await answer(env, i.queries[0], t0); await answer(env, i.queries[1], t0 + 5000); await answer(env, i.queries[1], t0 + 100000);
const first = [...urls]; urls.length = 0; _reset();
for (let k = 0; k < 60; k++) await answer(env, { ...i.queries[0], at: String(8000200 + k) }, t0 + k);
console.log(JSON.stringify({ out, first, limited: urls.length }));
"""


def py_caching():
    urls = []
    get = lambda url, env: (urls.append(url.split("timetables/v1")[1]), PLAN if "/plan/" in url else FCHG)[1]
    germany._plans.clear(), germany._changes.clear(), germany._asked.clear()
    env, t0 = {"DB_CLIENT_ID": "x", "DB_API_KEY": "y"}, 1793017200
    germany.dbtt_answer(env, QUERIES[0], t0, get), germany.dbtt_answer(env, QUERIES[1], t0 + 5, get)
    germany.dbtt_answer(env, QUERIES[1], t0 + 100, get)
    first = list(urls)
    urls.clear(), germany._plans.clear(), germany._changes.clear(), germany._asked.clear()
    for k in range(60):
        germany.dbtt_answer(env, {**QUERIES[0], "at": str(8000200 + k)}, t0 + k / 1000, get)
    return first, len(urls)


# ---------- Nothing changes for the other detail sources ----------
RELAY_RUN = """
const [dir, reqs] = [process.argv[1], JSON.parse(process.argv[2])];
const store = new Map();
globalThis.caches = { default: { match: async () => undefined, put: async () => {} } };
const seen = [];
globalThis.fetch = async (url, init) => {
  seen.push(String(url));
  if (String(url).includes("andamentoTreno") || String(url).includes("vehicle")) return new Response("{}", { headers: { "Content-Type": "application/json" } });
  return new Response("", { status: 404 });
};
const worker = (await import(dir + "/relay/worker.js")).default;
const env = { CH_FORMATION_KEY: "k", DB_CLIENT_ID: "x", DB_API_KEY: "y" };
const out = [];
for (const r of reqs) {
  seen.length = 0;
  const res = await worker.fetch(new Request("https://relay.example" + r, { headers: { "CF-Connecting-IP": "1.2.3.4" } }), env, { waitUntil() {} });
  out.push([r, res.status, [...seen], (await res.text()).slice(0, 200)]);
}
console.log(JSON.stringify(out));
"""
REQUESTS = ["/feed/irail?train=2204&date=2026-10-24&from=Bruxelles-Midi",
            "/feed/viaggiatreno?train=9611&date=2026-10-24&from=Torino%20Porta%20Nuova",
            "/feed/chfosbb?train=2806&date=2026-10-23&from=Z%C3%BCrich%20HB",
            "/feed/irail?train=0&date=2026-10-24&at=8000105&time=2610281430&line=ICE"]

PAGE_RUN = """
const dir = process.argv[1];
globalThis.localStorage = { getItem: () => null, setItem() {} };
globalThis.document = { documentElement: {}, addEventListener() {}, querySelector: () => null };
globalThis.window = globalThis;
const { detailUrl } = await import(dir + "/js/sources.js?v=dev");
const now = Math.floor(Date.now() / 1000);
const stop = (id, dt) => ({ stopId: id, arrival: { time: now + dt }, departure: { time: now + dt }, scheduled: now + dt });
const trains = [
  { agency: "sncb", number: "2204", origin: "Bruxelles-Midi", _progress: { stops: [stop("x", -600)] } },
  { agency: "bls", number: "3062", origin: "Bern", _progress: { stops: [stop("x", -600)] } },
  { agency: "sbb", number: "2806", origin: "Zürich HB", _progress: { stops: [stop("x", -600)] } },
  { agency: "sbb", number: null, origin: "Zürich HB", _progress: { stops: [stop("x", -600)] } },
  { agency: "dbfv", number: null, origin: "Berlin Hbf", route: "ICE",
    _progress: { stops: [stop("8011160", -3600), stop("de-somewhere", 600), stop("8000105", 1200), stop("8000096", 3600)] } },
];
console.log(JSON.stringify(trains.map((t) => detailUrl(t, "https://relay.example")?.replace(/time=\\d+/, "time=T") ?? null)));
"""


def run_node(script, *args):
    out = subprocess.run(["node", "--input-type=module", "-e", script, *args], cwd=ROOT, capture_output=True, text=True)
    assert out.returncode == 0, out.stderr[-3000:]
    return json.loads(out.stdout.strip().splitlines()[-1])


def main():
    dump = lambda x: json.dumps(x, ensure_ascii=False, separators=(",", ":"))
    py = [germany.detail(PLAN, FCHG, q) for q in QUERIES]
    assert py == WANT, dump(py)
    js = run_node(NODE_DETAIL, json.dumps({"plan": PLAN, "fchg": FCHG, "queries": QUERIES}))
    assert dump(js["out"]) == dump(py), dump(js["out"])
    print("DB Timetables detail: Python and Worker agree")
    first, limited = py_caching()
    want_first = ["/plan/8000105/261028/14", "/fchg/8000105", "/fchg/8000105"]
    assert first == want_first and js["first"] == want_first, (first, js["first"])
    assert limited == 50 and js["limited"] == 50, (limited, js["limited"])
    print("caching (plan once, changes every 90 s) and the limit (50 a minute): both twins")

    old = pathlib.Path(tempfile.mkdtemp())
    try:
        tar = subprocess.run(["git", "archive", "c9f0ca3", "relay", "js"], cwd=ROOT, capture_output=True, check=True).stdout
        subprocess.run(["tar", "-x", "-C", str(old)], input=tar, check=True)
        before, after = run_node(RELAY_RUN, str(old), json.dumps(REQUESTS[:3])), run_node(RELAY_RUN, str(ROOT), json.dumps(REQUESTS[:3]))
        assert before == after, (before, after)
        print("relay: iRail, ViaggiaTreno and Swiss formation queries ask the same upstream URLs and answer the same:",
              [b[2][:1] for b in before])
        # An "at" query on a numbered source is the number's query, as before.
        b, a = run_node(RELAY_RUN, str(old), json.dumps(REQUESTS[3:])), run_node(RELAY_RUN, str(ROOT), json.dumps(REQUESTS[3:]))
        assert b == a, (b, a)
        page_old, page_new = run_node(PAGE_RUN, str(old)), run_node(PAGE_RUN, str(ROOT))
        assert page_old[:4] == page_new[:4] and all(page_old[:3]) and page_old[3] is None, (page_old, page_new)
        dbtt = run_node(RELAY_RUN, str(ROOT), json.dumps(["/feed/dbtt?train=0&date=2026-10-28&at=8000105&time=2610281430&line=ICE",
                                                           "/feed/dbtt?train=0&date=2026-10-28&line=ICE"]))
        assert dbtt[0][1] == 200 and dbtt[0][2][0].endswith("/timetables/v1/plan/8000105/261028/14"), dbtt[0]
        assert dbtt[1][1] == 400 and not dbtt[1][2], dbtt[1]
        print("relay: Germany's source asks DB's plan for the station and hour, and turns away a query without its station")
        assert page_old[4] is None, page_old[4]
        assert page_new[4] == ("https://relay.example/feed/dbtt?train=0&date=" + page_new[4].split("date=")[1].split("&")[0]
                               + "&from=Berlin+Hbf&at=8000105&time=T&line=ICE"), page_new[4]
        print("page: the same detail URLs for SNCB's, BLS's and SBB's trains; Germany's by its next numbered station:", page_new[4])
    finally:
        shutil.rmtree(old)
    print("ok")


if __name__ == "__main__":
    main()
