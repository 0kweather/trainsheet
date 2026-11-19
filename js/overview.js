// The overview: zoomed out, the map loads no country's track, stations or
// feeds (all of Europe's at once froze the page for seconds) and shows a pin
// per country instead: its name, the trains its railroads run this hour, a
// dot when any of them is tracked live, and a stripe of its railroads in
// their colors, sized by their trains. A pin picks its country (app.js loads
// that one alone and opens its page). While a country is picked its pin
// stays, docked at the top of the map, and brings its page back; the
// countries around it show as named dots, at their pins or (just off
// screen) at the map's edge toward them, and pick theirs. Zooming out past
// the country brings the pins back. Everything here comes from
// data/overview.json (scripts/build_overview.py).

const GAP = 6;          // px kept between pins
const MIN_SHARE = 0.03; // railroads with less of the trains than this share the stripe's grey "others"
const OTHERS = "#9aa0a8";
const LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const clocks = {};
// [weekday (Monday 0), hour] now where a railroad is.
function weekHour(tz) {
  clocks[tz] ??= new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", hour: "numeric", hourCycle: "h23" });
  const p = Object.fromEntries(clocks[tz].formatToParts(new Date()).map((x) => [x.type, x.value]));
  return [["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(p.weekday), +p.hour % 24];
}

// opts: { map, agencies (AGENCIES), name(country) -> its name, live(country)
// -> whether a railroad of it is tracked live, railroads(country) -> its
// railroads, running(country) -> its trains on the map now once its feeds
// are in (else null: this hour's from its timetables), pad() -> the map's
// padding for the panel, T, lang, onPick(country), onDock(country): the
// docked pin tapped }.
export function overview(opts) {
  const { map, agencies, T } = opts;
  let data = null, cells = null, shown = false, focus = null, dotsOn = false;
  const pins = new Map(); // country -> { el, lon, lat, w, h, dx, dy, compact, off }

  const layer = document.createElement("div");
  layer.className = "ov-pins";
  const leaders = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  leaders.setAttribute("class", "ov-leaders");
  leaders.setAttribute("aria-hidden", "true");
  layer.append(leaders);
  map.getContainer().append(layer);

  // The picked country's docked pin and its neighbors' dots.
  const near = document.createElement("div");
  near.className = "ov-near";
  near.hidden = true;
  map.getContainer().append(near);
  const dock = document.createElement("button");
  dock.type = "button";
  dock.className = "ov-pin ov-dock";
  dock.addEventListener("click", () => focus && opts.onDock(focus));
  near.append(dock);
  const dots = new Map(); // country -> { el, lon, lat, w, h }

  const ready = fetch("data/overview.json?v=dev")
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then((d) => {
      data = d;
      // The grid's runs ("523.12a") as one letter a cell.
      const [, , , cols, rows, runs] = d.grid;
      cells = new Uint8Array(cols * rows); // 0: none, else the country's place in order, plus one
      let at = 0;
      for (const [, n, ch] of runs.matchAll(/(\d+)(\D)/g)) {
        if (ch !== ".") cells.fill(LETTERS.indexOf(ch) + 1, at, at + +n);
        at += +n;
      }
      build();
      dockPin();
      update();
      return d;
    })
    .catch((err) => {
      console.warn("overview", err);
      return null;
    });

  // The country under a point ("DE"), or null where none is near.
  function countryAt(lon, lat) {
    if (!cells) return null;
    const [w, s, step, cols, rows] = data.grid;
    lon = ((lon + 540) % 360) - 180;
    const x = Math.floor((lon - w) / step), y = Math.floor((lat - s) / step);
    if (x < 0 || y < 0 || x >= cols || y >= rows) return null;
    const c = cells[y * cols + x];
    return c ? data.order[c - 1] : null;
  }

  // Each railroad's trains this hour where it is.
  function trainsNow(country) {
    return data.countries[country].rr.map((id) => {
      const { tz, w } = data.rr[id];
      const [d, h] = weekHour(tz);
      return [id, w[d]?.[h] || 0];
    });
  }
  const runningNow = (country) => (data?.countries[country]?.rr.length ? trainsNow(country).reduce((s, [, n]) => s + n, 0) : null);

  // Today's trains by the hour where its railroads are, and this hour: null
  // for a country without timetables.
  function day(country) {
    const rr = data?.countries[country]?.rr;
    if (!rr?.length) return null;
    const hours = new Array(24).fill(0);
    for (const id of rr) {
      const { tz, w } = data.rr[id];
      const [d] = weekHour(tz);
      (w[d] || []).forEach((n, h) => (hours[h] += n));
    }
    return { hours, now: weekHour(data.rr[rr[0]].tz)[1] };
  }

  function pinHTML(country, docked = false) {
    const rr = trainsNow(country);
    const total = rr.reduce((s, [, n]) => s + n, 0);
    const now = docked ? opts.running(country) : null; // the docked pin: what the page says
    const parts = [];
    let others = 0;
    for (const [id, n] of rr) {
      if (total && n / total < MIN_SHARE) others += n;
      else if (n) parts.push([agencies[id]?.color || OTHERS, n, agencies[id]?.short || agencies[id]?.name || id]);
    }
    if (others) parts.push([OTHERS, others, T("Others")]);
    // No timetable to count from (Argentina's): its railroads, side by side.
    const all = opts.railroads(country);
    if (!parts.length) for (const id of all) parts.push([agencies[id]?.color || OTHERS, 1, agencies[id]?.short || id]);
    const name = opts.name(country);
    const live = opts.live(country);
    const count = now != null ? T("{n} running", { n: now.toLocaleString(opts.lang) })
      : rr.length ? T("{n} running", { n: total.toLocaleString(opts.lang) }) : opts.railroadCount(all.length);
    const names = all.map((id) => agencies[id]?.short || id).join(", ");
    return {
      full: `<span class="ov-name">${esc(name)}</span>
        <span class="ov-count"><span class="ov-live${live ? " on" : ""}"></span>${esc(count)}</span>
        <span class="ov-stripe">${parts.map(([c, n, label]) => `<span style="flex:${n};background:${c}" title="${esc(label)}"></span>`).join("")}</span>`,
      label: `${name}: ${count}. ${names}`,
      title: T("Show {country} on the map", { country: name }),
    };
  }

  function build() {
    for (const country of Object.keys(data.countries)) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "ov-pin";
      el.addEventListener("click", () => opts.onPick(country));
      layer.append(el);
      const [lon, lat] = data.countries[country].pin;
      pins.set(country, { el, lon, lat, dx: 0, dy: 0, compact: false, off: true });
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "ov-dot";
      dot.hidden = true;
      dot.innerHTML = `<span class="ov-dot-mark"></span><span class="ov-dot-name">${esc(opts.name(country))}</span>`;
      dot.title = T("Show {country} on the map", { country: opts.name(country) });
      dot.addEventListener("click", () => opts.onPick(country));
      near.append(dot);
      dots.set(country, { el: dot, lon, lat, w: 0, h: 0 });
    }
    refresh();
    setInterval(() => shown && refresh(), 5 * 60 * 1000);
  }

  // The pins' counts and live dots, again (the hour has turned, the relay answered).
  function refresh() {
    if (!data) return;
    for (const [country, p] of pins) {
      const h = pinHTML(country);
      p.el.innerHTML = h.full;
      p.el.setAttribute("aria-label", h.label);
      p.el.title = h.title;
    }
    dockPin();
    place();
  }
  // The picked country's pin, as its overview pin reads, docked.
  function dockPin() {
    if (!focus || !data?.countries[focus]) return;
    const h = pinHTML(focus, true);
    dock.innerHTML = h.full;
    dock.setAttribute("aria-label", `${h.label}. ${T("Open {country}'s page", { country: opts.name(focus) })}`);
    dock.title = T("Open {country}'s page", { country: opts.name(focus) });
  }

  // Busiest first (over the week, so a big network keeps its place at
  // night), each pin where it points, else beside that, else shrunk to its
  // name, else left out: never one over another.
  function place() {
    if (!shown) return;
    // Inside what the panel leaves of the map.
    const W = layer.clientWidth, H = layer.clientHeight, pad = opts.pad();
    const taken = [];
    const free = (x, y, w, h) => x >= pad.left + 4 && y >= pad.top + 4 && x + w <= W - pad.right - 4 && y + h <= H - pad.bottom - 4 &&
      taken.every((r) => x + w + GAP <= r[0] || r[0] + r[2] + GAP <= x || y + h + GAP <= r[1] || r[1] + r[3] + GAP <= y);
    const order = [...pins.entries()].sort((a, b) => weekly(b[0]) - weekly(a[0]));
    for (const [, p] of order) {
      const at = map.project([p.lon, p.lat]);
      p.off = true;
      if (behind(p) || at.x < -40 || at.y < -40 || at.x > W + 40 || at.y > H + 40) continue;
      p.el.hidden = false; // to be measured
      for (const compact of [false, true]) {
        p.el.classList.toggle("compact", compact);
        const w = p.el.offsetWidth, h = p.el.offsetHeight;
        const spots = [[0, 0], [0, -(h / 2 + 14)], [0, h / 2 + 14], [w / 2 + 14, 0], [-(w / 2 + 14), 0],
          [w / 2 + 10, -(h / 2 + 10)], [-(w / 2 + 10), -(h / 2 + 10)], [w / 2 + 10, h / 2 + 10], [-(w / 2 + 10), h / 2 + 10]];
        const spot = spots.find(([dx, dy]) => free(at.x + dx - w / 2, at.y + dy - h / 2, w, h));
        if (spot) {
          [p.dx, p.dy] = spot;
          p.w = w;
          p.h = h;
          p.compact = compact;
          p.off = false;
          taken.push([at.x + p.dx - w / 2, at.y + p.dy - h / 2, w, h]);
          break;
        }
      }
    }
    move();
  }
  // On the globe's far side (or too near its edge to read): more than 75°
  // round the earth from the middle of the map.
  const rad = Math.PI / 180;
  function behind(p) {
    const c = map.getCenter();
    const cos = Math.sin(c.lat * rad) * Math.sin(p.lat * rad) + Math.cos(c.lat * rad) * Math.cos(p.lat * rad) * Math.cos((p.lon - c.lng) * rad);
    return cos < Math.cos(75 * rad);
  }
  const weeklies = new Map();
  const weekly = (country) => {
    if (!weeklies.has(country)) {
      const rr = data.countries[country].rr;
      weeklies.set(country, rr.length ? rr.reduce((s, id) => s + data.rr[id].w.flat().reduce((a, b) => a + b, 0), 0) : opts.railroads(country).length);
    }
    return weeklies.get(country);
  };

  // The docked pin at the top middle of what the panel leaves of the map;
  // each country nearby as a dot at its pin, or at the edge toward it when
  // it's off screen by less than one and a half screens; busiest first,
  // never one over another (or over the docked pin).
  function placeNear() {
    if (!focus || !data) return;
    const W = near.clientWidth, H = near.clientHeight, pad = opts.pad();
    const L = pad.left, T0 = pad.top, R = W - pad.right, B = H - pad.bottom;
    const dw = dock.offsetWidth, dh = dock.offsetHeight;
    const dx = Math.round(L + (R - L - dw) / 2), dy = T0 + 12;
    dock.style.transform = `translate(${dx}px, ${dy}px)`;
    // Clear of the docked pin and the map's own buttons (zoom, scale, credits).
    const box = near.getBoundingClientRect();
    const taken = [[dx, dy, dw, dh], ...[...map.getContainer().querySelectorAll(".maplibregl-ctrl")].map((el) => {
      const r = el.getBoundingClientRect();
      return [r.left - box.left, r.top - box.top, r.width, r.height];
    }).filter((r) => r[2] && r[3])];
    const free = (x, y, w, h) => x >= L + 4 && y >= T0 + 4 && x + w <= R - 4 && y + h <= B - 4 &&
      taken.every((r) => x + w + GAP <= r[0] || r[0] + r[2] + GAP <= x || y + h + GAP <= r[1] || r[1] + r[3] + GAP <= y);
    const cx = (L + R) / 2, cy = (T0 + B) / 2, hw = (R - L) / 2, hh = (B - T0) / 2, inset = 16;
    for (const [c, d] of [...dots.entries()].sort((a, b) => weekly(b[0]) - weekly(a[0]))) {
      d.el.hidden = true;
      if (c === focus || !dotsOn || behind(d)) continue;
      let { x, y } = map.project([d.lon, d.lat]);
      const k = Math.max(Math.abs(x - cx) / hw, Math.abs(y - cy) / hh);
      if (k > 2.5) continue; // far off: no dot
      const edge = k > 1;
      if (edge) {
        x = Math.min(R - inset, Math.max(L + inset, cx + (x - cx) / k));
        y = Math.min(B - inset, Math.max(T0 + inset, cy + (y - cy) / k));
      }
      d.el.hidden = false;
      d.el.classList.toggle("edge", edge);
      if (!d.w) [d.w, d.h] = [d.el.offsetWidth, d.el.offsetHeight];
      // The name to the right of the mark, or the left near the right edge.
      const flip = x + d.w > R - 8;
      d.el.classList.toggle("flip", flip);
      const bx = Math.round(flip ? x - d.w + 7 : x - 7), by = Math.round(y - d.h / 2);
      if (!free(bx, by, d.w, d.h)) {
        d.el.hidden = true;
        continue;
      }
      taken.push([bx, by, d.w, d.h]);
      d.el.style.transform = `translate(${bx}px, ${by}px)`;
    }
  }

  // Follows the map between placings.
  function move() {
    let lines = "";
    for (const p of pins.values()) {
      p.el.hidden = !shown || p.off;
      if (p.el.hidden) continue;
      const at = map.project([p.lon, p.lat]);
      p.el.style.transform = `translate(${Math.round(at.x + p.dx - p.w / 2)}px, ${Math.round(at.y + p.dy - p.h / 2)}px)`;
      if (p.dx || p.dy) {
        lines += `<line x1="${at.x}" y1="${at.y}" x2="${at.x + p.dx}" y2="${at.y + p.dy}"/><circle cx="${at.x}" cy="${at.y}" r="2.5"/>`;
      }
    }
    leaders.innerHTML = shown ? lines : "";
  }

  // shown: the pins are wanted (nothing picked, zoomed out); focus: the
  // country picked, its pin docked; dots: its neighbors' dots are wanted
  // (zoomed out enough for them to be near).
  function update(state = {}) {
    if ("shown" in state) shown = state.shown;
    if ("dots" in state) dotsOn = state.dots;
    if ("focus" in state && state.focus !== focus) {
      focus = state.focus;
      dockPin();
    }
    layer.hidden = !shown || !data;
    near.hidden = !focus || !data?.countries[focus];
    if (shown && data) place();
    if (!near.hidden) placeNear();
  }

  map.on("move", () => {
    if (shown && data) move();
    if (focus && data) placeNear();
  });
  map.on("moveend", () => shown && data && place());
  map.on("resize", () => {
    if (shown && data) place();
    if (focus && data) placeNear();
  });
  // Once the map has drawn: the globe may not have been set up when the pins
  // were first placed.
  map.once("idle", () => {
    if (shown && data) place();
    if (focus && data) placeNear();
  });

  return {
    ready, countryAt, update, refresh, day, runningNow, dockPin,
    has: (country) => Boolean(data?.countries[country]),
    bbox: (country) => data?.countries[country]?.bbox || null,
    pin: (country) => data?.countries[country]?.pin || null,
    countries: () => (data ? Object.keys(data.countries) : []),
  };
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}
