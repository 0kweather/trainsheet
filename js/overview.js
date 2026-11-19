// The overview: zoomed out, the map loads no country's track, stations or
// feeds (all of Europe's at once froze the page for seconds) and shows a pin
// per country instead: its name, the trains its railroads run this hour, a
// dot when any of them is tracked live, and a stripe of its railroads in
// their colors, sized by their trains. A pin picks its country (app.js loads
// that one alone and opens its page); a button at the top of the map goes
// back to the pins. Everything here comes from data/overview.json
// (scripts/build_overview.py).

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
// railroads, pad() -> the map's padding for the panel, T, lang,
// onPick(country), onBack() }.
export function overview(opts) {
  const { map, agencies, T } = opts;
  let data = null, cells = null, shown = false, focus = null;
  const pins = new Map(); // country -> { el, lon, lat, w, h, dx, dy, compact, off }

  const layer = document.createElement("div");
  layer.className = "ov-pins";
  const leaders = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  leaders.setAttribute("class", "ov-leaders");
  leaders.setAttribute("aria-hidden", "true");
  layer.append(leaders);
  map.getContainer().append(layer);

  const back = document.createElement("button");
  back.type = "button";
  back.className = "ov-back";
  back.hidden = true;
  back.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span></span>`;
  back.addEventListener("click", () => opts.onBack());
  map.getContainer().append(back);

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

  function pinHTML(country) {
    const rr = trainsNow(country);
    const total = rr.reduce((s, [, n]) => s + n, 0);
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
    const count = rr.length ? T("{n} running", { n: total.toLocaleString(opts.lang) }) : opts.railroadCount(all.length);
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
    place();
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
      if (at.x < -40 || at.y < -40 || at.x > W + 40 || at.y > H + 40) continue;
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
  const weeklies = new Map();
  const weekly = (country) => {
    if (!weeklies.has(country)) {
      const rr = data.countries[country].rr;
      weeklies.set(country, rr.length ? rr.reduce((s, id) => s + data.rr[id].w.flat().reduce((a, b) => a + b, 0), 0) : opts.railroads(country).length);
    }
    return weeklies.get(country);
  };

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
  // country picked, which the back button leaves.
  function update(state = {}) {
    if ("shown" in state) shown = state.shown;
    if ("focus" in state) focus = state.focus;
    layer.hidden = !shown || !data;
    back.hidden = !focus;
    if (focus) {
      back.querySelector("span").textContent = T("Countries");
      back.setAttribute("aria-label", T("Back to all countries"));
      const pad = opts.pad();
      back.style.left = `${pad.left + 12}px`;
      back.style.top = `${pad.top + 12}px`;
    }
    if (shown && data) place();
  }

  map.on("move", () => shown && data && move());
  map.on("moveend", () => shown && data && place());
  map.on("resize", () => shown && data && place());

  return {
    ready, countryAt, update, refresh, day, runningNow,
    has: (country) => Boolean(data?.countries[country]),
    bbox: (country) => data?.countries[country]?.bbox || null,
    pin: (country) => data?.countries[country]?.pin || null,
    countries: () => (data ? Object.keys(data.countries) : []),
  };
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}
