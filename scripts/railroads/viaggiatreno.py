"""Off for now (October 2026): ViaggiaTreno's CDN (Akamai) refuses every
request from Cloudflare's network with "Access Denied", whatever its headers,
though it answers the same request from a home connection; no railroad names
this source until the relay can reach it. ViaggiaTreno, Trenitalia's live running information (viaggiatreno.it):
how late one train is, where it was last reported, its platforms and its
stop-by-stop times, for the trains of Trenitalia (Frecce, Intercity,
Regionale, Tper) and of Trenord, which ViaggiaTreno also covers.

A relay-only plug-in, with no railroads of its own: it defines a detail
source (DETAILS), which the relay serves one train at a time as
/feed/viaggiatreno?train=<number>&date=<yyyy-mm-dd>[&from=<origin name>],
and which a railroad uses by naming it in its AGENCIES entry
("detail": "viaggiatreno"). The page asks for a train only when a viewer
opens or tracks it, and again every two minutes while it stays open or
tracked (js/app.js); nothing is ever polled for trains nobody opened. The
answer is the same shape for every detail source and needs no parser file
(js/sources.js applyDetail).

ViaggiaTreno's terms forbid reuse of its data. Rome's court, in Trenitalia
v. GoBright (RG 34006/2019, order of 4 September 2019), accepted an app
asking it for one train at a time when a user asks, as opposed to polling or
harvesting every train, and this plug-in keeps to that: one train per
request, on a viewer's request, each answer kept 90 s at the relay and each
train's origin remembered, so a train refreshed while it's open costs one
request upstream every two minutes at most.

ViaggiaTreno answers only browser-like User-Agents, and refuses one that
holds a URL (http:// or https://), so the relay names itself as
"Mozilla/5.0 (compatible; Trainsheet/1.0; +trainsheet.com)". Its https
address redirects to http. relay_fetch is the twin of
relay/feeds/viaggiatreno.js: the same bytes for the same upstream answers.
"""
import json, re, time, unicodedata, urllib.request

DETAILS = {"viaggiatreno": {"ttl": 90}}

API = "http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno"
UA = "Mozilla/5.0 (compatible; Trainsheet/1.0; +trainsheet.com)"
ORIGIN_SECONDS = 6 * 3600  # how long a train's origin (and its day's key) is remembered
origins = {}  # "number|date|from" -> (when, (origin station id, midnight ms))


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json, text/plain, */*"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode("utf-8")


def name_key(s):
    """A station name compared loosely: no accents, case, spaces or dots."""
    s = unicodedata.normalize("NFD", s or "")
    return re.sub(r"[^a-z0-9]", "", re.sub(r"[\u0300-\u036f]", "", s).lower())


def find_origin(number, date, frm):
    """The train's origin station id and day key, from ViaggiaTreno's search
    by number: one line per run, "9611 - TORINO PORTA NUOVA - 19/10/26|
    9611-S00219-1792360800000". Of that day's runs (a regional number can be
    used in two places), the one from `frm` (a name key) or the only one."""
    y, m, d = date.split("-")
    day = f"{d}/{m}/{y[2:]}"
    runs = []
    for line in get(f"{API}/cercaNumeroTrenoTrenoAutocomplete/{number}").splitlines():
        label, _, key = line.partition("|")
        parts = label.split(" - ")
        bits = key.strip().split("-")
        if len(parts) >= 3 and parts[-1].strip() == day and len(bits) == 3:
            runs.append((name_key(" - ".join(parts[1:-1])), bits[1], int(bits[2])))
    pick = [r for r in runs if frm and r[0] == frm] or (runs if len(runs) == 1 else [])
    return pick and (pick[0][1], pick[0][2]) or None


def secs(ms):
    return ms // 1000 if isinstance(ms, (int, float)) and ms > 0 else None


def platform(f):
    for k in ("binarioEffettivoPartenzaDescrizione", "binarioEffettivoArrivoDescrizione",
              "binarioProgrammatoPartenzaDescrizione", "binarioProgrammatoArrivoDescrizione"):
        v = (f.get(k) or "").strip()
        if v:
            return v
    return None


def compact(number, date, run):
    """The page's detail shape (js/sources.js applyDetail), from andamentoTreno.
    provvedimento 1 is a train cancelled outright; a stop whose
    actualFermataType is 3 is cancelled."""
    last = run.get("stazioneUltimoRilevamento")
    stops = [{"name": f.get("stazione"), "arr": secs(f.get("arrivo_teorico")), "dep": secs(f.get("partenza_teorica")),
              "actualArr": secs(f.get("arrivoReale")), "actualDep": secs(f.get("partenzaReale")),
              "platform": platform(f), "cancelled": f.get("actualFermataType") == 3} for f in run.get("fermate") or []]
    return {"found": True, "number": number, "date": date, "origin": run.get("origine"), "destination": run.get("destinazione"),
            "delay": run.get("ritardo") if isinstance(run.get("ritardo"), int) else None,
            "cancelled": run.get("provvedimento") == 1, "departed": not run.get("nonPartito") and bool(secs(run.get("oraUltimoRilevamento"))),
            "arrived": bool(run.get("arrivato")),
            "last": {"station": last, "at": secs(run.get("oraUltimoRilevamento"))} if last and last != "--" else None,
            "stops": stops}


def relay_fetch(env, source_id, query):
    """One train's detail, as JSON: the same bytes as
    relay/feeds/viaggiatreno.js. query: {"train", "date", "from"}, checked
    and normalised by the relay (from is a name key, maybe empty)."""
    number, date, frm = query["train"], query["date"], query.get("from", "")
    k = f"{number}|{date}|{frm}"
    hit = origins.get(k)
    origin = hit[1] if hit and time.time() - hit[0] < ORIGIN_SECONDS else find_origin(number, date, frm)
    if origin and origin != (hit and hit[1]):  # a train not found is looked up again next time
        if len(origins) > 500:
            origins.clear()
        origins[k] = (time.time(), origin)
    run = None
    if origin:
        text = get(f"{API}/andamentoTreno/{origin[0]}/{number}/{origin[1]}").strip()
        run = json.loads(text) if text else None
    out = compact(number, date, run) if run else {"found": False, "number": number, "date": date}
    return json.dumps(out, ensure_ascii=False, separators=(",", ":")).encode("utf-8"), "application/json"
