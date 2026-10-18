// FGC's Geotren trains, wrapped with the time its open data portal last
// processed them: the Worker's twin of relay_fetch in scripts/railroads/fgc.py,
// giving the same bytes.

const PORTAL = "https://dadesobertes.fgc.cat/api/explore/v2.1/catalog/datasets";
const TRAINS = `${PORTAL}/posicionament-dels-trens/exports/json?select=`
  + "id,lin,geo_point_2d,dir,origen,desti,properes_parades,estacionat_a,en_hora,tipus_unitat,ut";
const PROCESSED = `${PORTAL}?where=dataset_id%3D%22posicionament-dels-trens%22&select=data_processed`;
const UA = "Trainsheet/1.0 (+https://trainsheet.com)";

async function get(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`FGC open data: HTTP ${res.status}`);
  return res;
}

export async function fetchFeed(env, name, ctx) {
  const [trains, meta] = await Promise.all([get(TRAINS).then((r) => r.text()), get(PROCESSED).then((r) => r.json())]);
  const processed = meta.results?.[0]?.data_processed ?? null;
  return new Response(`{"processed": ${JSON.stringify(processed)}, "trains": ${trains}}`,
    { headers: { "Content-Type": "application/json" } });
}
