// Hellenic Train's positions (scripts/railroads/hellenictrain.py): railway.gov.gr
// sends them as server-sent events; this reads the stream until its first list
// of positions (event trainPositionsUx), passes that event's data on as JSON
// and closes the stream, as relay_fetch does for scripts/dev_relay.py.

const STREAM = "https://railway.gov.gr/api/train-stream";
const IDENTIFYING_UA = "Trainsheet/1.0 (+https://trainsheet.com)";

export async function fetchFeed(env, name, ctx) {
  const res = await fetch(STREAM, { headers: { "User-Agent": IDENTIFYING_UA, Accept: "text/event-stream" } });
  if (!res.ok || !res.body) return new Response(`Upstream ${res.status}`, { status: 502 });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const deadline = Date.now() + 15000;
  let buf = "", event = null;
  try {
    while (Date.now() < deadline) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).replace(/\r$/, "");
        buf = buf.slice(nl + 1);
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:") && event === "trainPositionsUx") {
          return new Response(line.slice(5).trim(), { headers: { "Content-Type": "application/json" } });
        } else if (!line) event = null;
      }
    }
  } finally {
    reader.cancel().catch(() => {});
  }
  return new Response("The stream sent no positions", { status: 502 });
}
