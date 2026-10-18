"""Local stand-in for relay/worker.js, for development without Cloudflare.

    python3 scripts/dev_relay.py          # serves http://127.0.0.1:8787
    python3 scripts/dev_relay.py 8871     # ...or on another port

then set window.TRAINSHEET_RELAY = "http://127.0.0.1:8787" in config.js.
Keyed feeds read the same environment variables as the Worker's secrets
(METRA_API_TOKEN, API_511_KEY, METROLINK_API_KEY). NJ Transit and GO Transit (scraped from their websites) are Worker-only.
The railroad plug-ins' feeds (scripts/railroads/*.py) are read from their
RELAY specs and relay_fetch handlers directly, each kept for its own ttl.
"""
import json, os, re, sys, time, urllib.parse, urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from railroads import load

q = urllib.parse.quote
FEEDS = {
    "septa": lambda e: {"url": "https://www3.septa.org/api/TrainView/index.php"},
    "rtd": lambda e: {"url": "https://open-data.rtd-denver.com/files/gtfs-rt/rtd/VehiclePosition.pb"},
    "uta": lambda e: {"url": "https://apps.rideuta.com/tms/gtfs/Vehicle"},
    "metra": lambda e: e.get("METRA_API_TOKEN") and {
        "url": "https://gtfspublic.metrarr.com/gtfs/public/positions?api_token=" + q(e["METRA_API_TOKEN"])},
    "caltrain": lambda e: e.get("API_511_KEY") and {
        "url": "https://api.511.org/transit/vehiclepositions?agency=CT&api_key=" + q(e["API_511_KEY"])},
    "smart": lambda e: e.get("API_511_KEY") and {
        "url": "https://api.511.org/transit/vehiclepositions?agency=SA&api_key=" + q(e["API_511_KEY"])},
    "metrolink": lambda e: e.get("METROLINK_API_KEY") and {
        "url": "https://metrolink-gtfsrt.gbsdigital.us/feed/gtfsrt-vehicles",
        "headers": {"X-Api-Key": e["METROLINK_API_KEY"]}},
}
CACHE_SECONDS = 15
IDENTIFYING_UA = "Trainsheet/1.0 (+https://trainsheet.com)"
cache = {}


def plugin_feed(mod, sid, p):
    """A plug-in's feed as a spec, like relay/worker.js's pluginFeed: {NAME}
    filled from the environment (quoted in urls), off while a key is unset.
    No url means the module's relay_fetch fetches it. Its routes or
    vehicles filter is applied as the Worker applies it."""
    def spec(e):
        if any(not e.get(k) for k in p.get("keys", [])):
            return None
        fill = lambda s, esc: re.sub(r"\{([A-Z0-9_]+)\}", lambda m: esc(e.get(m.group(1), "")), s)
        headers = {"User-Agent": IDENTIFYING_UA} if p.get("ua") else {}
        headers.update({k: fill(v, str) for k, v in p.get("headers", {}).items()})
        return {"url": p.get("url") and fill(p["url"], lambda v: q(v, safe="")),
                "also": [fill(u, lambda v: q(v, safe="")) for u in p.get("also", [])],
                "headers": headers, "ttl": p.get("ttl", CACHE_SECONDS),
                "routes": p.get("routes"), "vehicles": p.get("vehicles") and re.compile(p["vehicles"]),
                "fetch": None if p.get("url") else lambda: mod.relay_fetch(e, sid)}
    return spec


for mod in load():
    relay = getattr(mod, "RELAY", {})
    for s in getattr(mod, "SOURCES", []):
        if s.get("relay"):
            FEEDS[s["id"]] = plugin_feed(mod, s["id"], relay.get(s["id"], {}))


# GTFS-realtime filtering, as relay/worker.js's keepRoutes and keepVehicles:
# the header, and only the entities on the given routes (or of the vehicles
# whose id matches, with their trips' updates), copied byte for byte.
def varint(b, i):
    v = shift = 0
    while True:
        x = b[i]
        i += 1
        v |= (x & 0x7F) << shift
        shift += 7
        if not x & 0x80:
            return v, i


def fields_of(b, start=0, end=None):
    """(field, wire type, start, value start, end) of each field."""
    i, end = start, len(b) if end is None else end
    while i < end:
        s = i
        key, i = varint(b, i)
        f, w = key >> 3, key & 7
        vs = i
        if w == 0:
            _, i = varint(b, i)
        elif w == 1:
            i += 8
        elif w == 5:
            i += 4
        elif w == 2:
            n, vs = varint(b, i)
            i = vs + n
        else:
            return
        yield f, w, s, vs, i


def child(b, span, f):
    return next(((x[3], x[4]) for x in fields_of(b, *span) if x[0] == f and x[1] == 2), None)


def text(b, span, *fs):
    for f in fs:
        span = span and child(b, span, f)
    return span and b[span[0]:span[1]].decode("utf-8", "replace")


def keep_routes(b, routes):
    def keep(x):
        return x[0] != 2 or any(child(b, x[3:], k) and text(b, x[3:], k, 1, 5) in routes for k in (3, 4))
    return b"".join(b[x[2]:x[4]] for x in fields_of(b) if keep(x))


def keep_vehicles(b, pattern):
    ents = list(fields_of(b))
    vehicles = {x for x in ents if x[0] == 2 and child(b, x[3:], 4) and pattern.search(text(b, x[3:], 4, 8, 1) or "")}
    trips = {text(b, x[3:], 4, 1, 1) for x in vehicles} - {None}

    def keep(x):
        if x[0] != 2 or x in vehicles:
            return True
        if child(b, x[3:], 3):
            return text(b, x[3:], 3, 1, 1) in trips
        return not child(b, x[3:], 4)
    return b"".join(b[x[2]:x[4]] for x in ents if keep(x))


def get(url, headers):
    req = urllib.request.Request(url, headers={"User-Agent": "Trainsheet relay", **headers})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read(), r.headers.get("Content-Type", "application/octet-stream")


class Handler(BaseHTTPRequestHandler):
    def send(self, status, body, ctype="text/plain"):
        self.send_response(status)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Type", ctype)
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        env = os.environ
        if self.path == "/status":
            feeds = {k: bool(f(env)) for k, f in FEEDS.items()}
            return self.send(200, json.dumps({"feeds": feeds}).encode(), "application/json")
        name = self.path.removeprefix("/feed/")
        spec = FEEDS.get(name, lambda e: None)(env)
        if not self.path.startswith("/feed/") or not spec:
            return self.send(404, b"Unknown or unconfigured feed")
        hit = cache.get(name)
        if hit and time.time() - hit[0] < spec.get("ttl", CACHE_SECONDS):
            return self.send(200, hit[1], hit[2])
        try:
            if spec.get("fetch"):
                body, ctype = spec["fetch"]()
            else:
                body, ctype = get(spec["url"], spec.get("headers", {}))
                # Positions, then the first of the predicted stop times that answers.
                for url in spec.get("also", []):
                    try:
                        body += get(url, spec.get("headers", {}))[0]
                        break
                    except Exception:
                        pass
        except Exception as err:
            return self.send(502, f"Upstream error: {err}".encode())
        # Feeds that cover a whole network: only the trains' entities go on.
        if spec.get("routes"):
            body = keep_routes(body, spec["routes"])
        if spec.get("vehicles"):
            body = keep_vehicles(body, spec["vehicles"])
        cache[name] = (time.time(), body, ctype)
        self.send(200, body, ctype)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8787
    print(f"Trainsheet dev relay on http://127.0.0.1:{port}")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
