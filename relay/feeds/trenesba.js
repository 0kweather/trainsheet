// Trenes Argentinos (Buenos Aires): SOFSE's station arrivals for the stations
// in scripts/railroads/trenesba.py's STATIONS, merged into one list of
// positioned trains, each service and each unit once. The Worker twin of
// that module's relay_fetch, giving the same bytes.

const UPSTREAM = "https://api-servicios.sofse.gob.ar/v1/arribos/estacion/";
const IDENTIFYING_UA = "Trainsheet/1.0 (+https://trainsheet.com)";
const STATIONS = [50, 300, 229, 65, 1, 79, 119, 368, 386, 392, 380, 435, 165, 125, 297, 411, 427, 178, 232, 42, 58];

// An ISO time as whole seconds, or null.
const epoch = (s) => {
  const m = s && /^(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+)/.exec(s);
  return m ? Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +m[6]) / 1000 : null;
};

// [station id, name, scheduled arrival, scheduled departure, arrival,
// departure (actual where passed, else estimated), platform, passed].
function stop(e) {
  const arr = e.llegada || {}, dep = e.salida || {};
  return [e.idElemento, e.nombre, epoch(arr.programada), epoch(dep.programada),
    epoch(arr.real || arr.estimada), epoch(dep.real || dep.estimada), e.anden?.nombre ?? null, arr.real || dep.real ? 1 : 0];
}

// A unit standing at a terminal shows on its next service too; the one under
// way (or at the platform) is the train.
const RANK = { "Partió": 0, "En Andén": 1 };
const rank = (s) => RANK[s] ?? 2;

function merge(answers) {
  let at = 0;
  const trains = [], units = new Map(), seen = new Set();
  for (const d of answers) {
    if (!d) continue;
    at = Math.max(at, d.timestamp || 0);
    for (const r of d.results || []) {
      const sv = r.servicio, loc = sv.location;
      if (seen.has(sv.id) || !loc || sv.oculto) continue;
      seen.add(sv.id);
      const tipo = sv.tipo || {}, unit = sv.equipo?.nombre ?? null;
      const t = {
        id: sv.id, n: sv.numero, line: sv.gerencia.nombre, branch: sv.ramal.nombre,
        dir: sv.sentido ?? null, unit, type: tipo.nombre ?? null,
        class: tipo.clasificacion?.nombre ?? null,
        state: sv.desde?.estado?.nombre ?? null,
        cancel: sv.cancelacion ? 1 : 0, lat: loc.lat, lon: loc.long,
        stops: (sv.estaciones || []).filter((e) => e.parada !== false).map(stop),
      };
      if (unit !== null && units.has(unit)) {
        const i = units.get(unit);
        if (rank(t.state) < rank(trains[i].state)) trains[i] = t;
        continue;
      }
      if (unit !== null) units.set(unit, trains.length);
      trains.push(t);
    }
  }
  return { at, trains };
}

export async function fetchFeed(env, name, ctx) {
  const answers = await Promise.all(STATIONS.map((sid) =>
    fetch(`${UPSTREAM}${sid}`, { headers: { "User-Agent": IDENTIFYING_UA } })
      .then((r) => (r.ok ? r.json() : null)).catch(() => null)));
  if (!answers.some(Boolean)) return new Response("No station answered", { status: 502 });
  return new Response(JSON.stringify(merge(answers)), { headers: { "Content-Type": "application/json; charset=utf-8" } });
}
