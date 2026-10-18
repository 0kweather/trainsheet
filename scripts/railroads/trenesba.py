"""Trenes Argentinos in and around Buenos Aires (the Roca, Sarmiento, Mitre,
San Martín and Belgrano Sur lines and the Tren de la Costa): the arrivals
that SOFSE's own app reads, station by station, with each train's GPS
position, unit, stops and times. The answer needs no key and carries CORS
headers, but it comes one station at a time, so the relay asks the stations
listed in STATIONS (a few by each end of every line, where every train still
has them ahead of it) and passes on one list of trains, deduplicated by
service and unit: relay_fetch here and its Worker twin relay/feeds/trenesba.js.
The parser is js/railroads/trenesba.js.

The station endpoint is open; the API's other endpoints (station search,
lines) need a token from a handshake taken out of the Android app, which the
volunteer proxy github.com/ariedro/api-trenes (WTFPL) performs. This uses
only the open one, and the timetable's stop ids, which are SOFSE's own.

Belgrano Norte (Ferrovías) and the Urquiza (Metrovías) aren't in either."""
import calendar, json, re, urllib.request
from concurrent.futures import ThreadPoolExecutor

AGENCIES = {
    "trenesba": {"name": "Trenes Argentinos", "short": "Trenes Arg.", "region": "Buenos Aires", "country": "AR", "color": "#1f4e9a",
                 "kind": "commuter", "tz": "America/Argentina/Buenos_Aires",
                 "credit": {"label": "Trenes Argentinos", "href": "https://www.argentina.gob.ar/transporte/trenes-argentinos"},
                 "license": "CC BY 2.5 AR (timetable, Buenos Aires Data)", "bbox": [-59.45, -35.6, -57.9, -34.05], "cars": True},
}
# SOFSE's arrivals come at most every 10 s or so per station; one shared copy
# a minute keeps the relay to len(STATIONS) requests a minute for each Worker
# instance serving viewers (one per busy Cloudflare location), however many
# viewers each has, and the page asks no more often than that.
SOURCES = [{"id": "trenesba", "agencies": ["trenesba"], "format": "json", "interval": 60, "relay": True, "needsKey": False,
            "scope": "view"}]
RELAY = {"trenesba": {"ua": True, "ttl": 60}}

UPSTREAM = "https://api-servicios.sofse.gob.ar/v1/arribos/estacion/"
IDENTIFYING_UA = "Trainsheet/1.0 (+https://trainsheet.com)"
# A station lists the trains still to call there in the next hour and a half
# or so, both ways, with their positions. The second station from each end of
# a line sees every train headed that way until its last stop: inbound ones at
# the city end, outbound ones at the far end of each branch. Temperley stands
# in for the Roca's Glew, Claypole and diesel short runs, which pass it.
STATIONS = [
    50, 300,             # Sarmiento: Caballito, Paso del Rey
    229, 65,             # Mitre (Tigre): L. de la Torre, Carupá
    1, 79, 119,          # Mitre (Suárez, Mitre): 3 de Febrero, Chilavert, Dr. Cetrángolo
    368, 386,            # Roca: Santillán y Kosteki, Temperley
    392, 380, 435,       # Roca: Tolosa (La Plata), Sourigues and Zeballos (Bosques)
    165, 125,            # Roca: Guernica (A. Korn), El Jagüel (Ezeiza)
    297, 411,            # San Martín: Palermo, Villa Astolfi
    427, 178, 232,       # Belgrano Sur: Villa Soldati, Independencia, Libertad
    42, 58,              # Tren de la Costa: Borges, Canal San Fernando
]


def epoch(s):
    """An ISO time ("2026-10-18T00:50:00.000Z") as whole seconds, or None."""
    m = re.match(r"(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+)", s or "")
    return calendar.timegm(tuple(int(x) for x in m.groups()) + (0, 0, 0)) if m else None


def stop(e):
    """[station id, name, scheduled arrival, scheduled departure, arrival,
    departure (actual where passed, else estimated), platform, passed]."""
    arr, dep = e.get("llegada") or {}, e.get("salida") or {}
    return [e["idElemento"], e["nombre"], epoch(arr.get("programada")), epoch(dep.get("programada")),
            epoch(arr.get("real") or arr.get("estimada")), epoch(dep.get("real") or dep.get("estimada")),
            (e.get("anden") or {}).get("nombre"), 1 if arr.get("real") or dep.get("real") else 0]


# A unit standing at a terminal shows on its next service too; the one under
# way (or at the platform) is the train.
RANK = {"Partió": 0, "En Andén": 1}


def merge(answers):
    """The stations' answers (None for one that failed), in STATIONS order,
    as one list of positioned trains, each service once and each unit once."""
    at, trains, units = 0, [], {}
    seen = set()
    for d in answers:
        if not d:
            continue
        at = max(at, d.get("timestamp") or 0)
        for r in d.get("results") or []:
            sv = r["servicio"]
            loc = sv.get("location")
            if sv["id"] in seen or not loc or sv.get("oculto"):
                continue
            seen.add(sv["id"])
            tipo, unit = sv.get("tipo") or {}, (sv.get("equipo") or {}).get("nombre")
            t = {"id": sv["id"], "n": sv["numero"], "line": sv["gerencia"]["nombre"], "branch": sv["ramal"]["nombre"],
                 "dir": sv.get("sentido"), "unit": unit, "type": tipo.get("nombre"),
                 "class": (tipo.get("clasificacion") or {}).get("nombre"),
                 "state": ((sv.get("desde") or {}).get("estado") or {}).get("nombre"),
                 "cancel": 1 if sv.get("cancelacion") else 0, "lat": loc["lat"], "lon": loc["long"],
                 "stops": [stop(e) for e in sv.get("estaciones") or [] if e.get("parada") is not False]}
            if unit is not None and unit in units:
                i = units[unit]
                if RANK.get(t["state"], 2) < RANK.get(trains[i]["state"], 2):
                    trains[i] = t
                continue
            if unit is not None:
                units[unit] = len(trains)
            trains.append(t)
    return {"at": at, "trains": trains}


def relay_fetch(env, source_id):
    def get(sid):
        try:
            req = urllib.request.Request(f"{UPSTREAM}{sid}", headers={"User-Agent": IDENTIFYING_UA})
            with urllib.request.urlopen(req, timeout=20) as r:
                return json.load(r)
        except Exception:
            return None
    with ThreadPoolExecutor(8) as pool:
        answers = list(pool.map(get, STATIONS))
    if not any(answers):
        raise RuntimeError("no station answered")
    return json.dumps(merge(answers), separators=(",", ":"), ensure_ascii=False).encode(), "application/json; charset=utf-8"


# The city's open-data copy of the timetable (February to April 2020, long
# expired) still has every station and line, with SOFSE's own station ids, so
# it gives the stations only: no timetable file, no "Later today" and no first
# trains from times six years old. Its route ids are SOFSE's lines' branches;
# the line is the name before " / " ("Roca / Plaza Constitución - La Plata").
LINES = {"San Martin": "San Martín"}
GTFS = {
    "trenesba": ("https://cdn.buenosaires.gob.ar/datosabiertos/datasets/trenes-gtfs/trenes-gtfs.zip", lambda r: r.get("route_type") == "2",
                 lambda r: (lambda n: LINES.get(n, n))(r["route_long_name"].split(" / ")[0].strip()),
                 {"schedule": False, "firsts": False,
                  "names": {"Retiro LM": "Retiro (Mitre)", "Retiro LSM": "Retiro (San Martín)", "Dr. Sáenz nueva": "Dr. Sáenz (viaducto)"}}),
}

# The lines' own route relations in OpenStreetMap, by operator; the Tren de
# la Costa's are route=light_rail, the others' route=train.
RAIL = {"region": "ar", "bbox": [-59.45, -35.6, -57.9, -34.05], "network": "trenesba",
        "query": 'relation["route"~"^(train|light_rail)$"]["operator"~"Trenes Argentinos|SOFSE|Tren Universitario",i]({bbox});'
                 'way(r)["railway"~"^(rail|light_rail)$"]({bbox});'}
