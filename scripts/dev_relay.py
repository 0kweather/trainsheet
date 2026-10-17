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
    No url means the module's relay_fetch fetches it. (The routes filter
    is Worker-only: the page keeps only the trains it wants anyway.)"""
    def spec(e):
        if any(not e.get(k) for k in p.get("keys", [])):
            return None
        fill = lambda s, esc: re.sub(r"\{([A-Z0-9_]+)\}", lambda m: esc(e.get(m.group(1), "")), s)
        headers = {"User-Agent": IDENTIFYING_UA} if p.get("ua") else {}
        headers.update({k: fill(v, str) for k, v in p.get("headers", {}).items()})
        return {"url": p.get("url") and fill(p["url"], lambda v: q(v, safe="")),
                "also": [fill(u, lambda v: q(v, safe="")) for u in p.get("also", [])],
                "headers": headers, "ttl": p.get("ttl", CACHE_SECONDS),
                "fetch": None if p.get("url") else lambda: mod.relay_fetch(e, sid)}
    return spec


for mod in load():
    relay = getattr(mod, "RELAY", {})
    for s in getattr(mod, "SOURCES", []):
        if s.get("relay"):
            FEEDS[s["id"]] = plugin_feed(mod, s["id"], relay.get(s["id"], {}))


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
        cache[name] = (time.time(), body, ctype)
        self.send(200, body, ctype)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8787
    print(f"Trainsheet dev relay on http://127.0.0.1:{port}")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
