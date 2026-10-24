import { AGENCIES, SOURCES, fetchSource, creditOf, advanceEstimated, detailUrl, fetchDetail, applyDetail } from "./sources.js?v=dev";
import { loadStations, mergeStations, trainsDue, mbtaPredictions, mbtaFacilities, amtrakAddress, meters, norm, fold, stopKey } from "./stations.js?v=dev";
import { RailIndex, snapToTrack } from "./estimate.js?v=dev";
import { RAIL_REGIONS, DATA_REGIONS } from "./railroads/index.js?v=dev";
import { watchRegions } from "./railregions.js?v=dev";
import { NETWORKS, networkColor } from "./networks.js?v=dev";
import { trainNotices, stationNotices } from "./notices.js?v=dev";
import { loadDisruptions, aboutLine } from "./disruptions.js?v=dev";
import { inferDelay, restoreFeed } from "./delays.js?v=dev";
import { consistOf, consistHtml, carSvg, modelIds, fleetSamples, onCars, loadCars, pluginFacts } from "./consist.js?v=dev";
import { stationLifts } from "./lifts.js?v=dev";
import { t as T, tn as Tn, lang, langPref, locale, dateFormat, translatePage } from "./i18n.js?v=dev";

// localStorage "tt-relay" overrides config.js, handy when testing a relay locally.
const RELAY = ((() => { try { return localStorage.getItem("tt-relay"); } catch { return null; } })() ||
  window.TRAINSHEET_RELAY || "").trim();
const STYLES = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark",
};
const STALE_MS = 10 * 60 * 1000;
const ANIM_MS = 1200;

const $ = (id) => document.getElementById(id);
// Attach a listener if the element exists. A missing element (say, a stale
// cached page) must never stop the trains from loading.
const on = (id, type, fn) => $(id)?.addEventListener(type, fn);
// The back button's label: where it goes.
const setBack = (label) => { const el = $("back-btn")?.querySelector("span"); if (el) el.textContent = label; };
const setChecked = (id, value) => { const el = $(id); if (el) el.checked = value; };
// Number plate: a train's number on a white sign, railroad color on top.
const plate = (text, color, size = "") => `<span class="plate ${size}" style="--c:${color}"><span>${esc(text)}</span></span>`;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
// A title that may break after a slash ("Framingham/Worcester Line"), which
// browsers otherwise treat as one unbreakable word.
const escTitle = (s) => esc(s).replace(/\//g, "/<wbr>");
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

translatePage(); // index.html's own text, in French when that's the language
document.documentElement.classList.remove("i18n-wait"); // ...shown once it is (index.html)

// ---------- State ----------

const state = {
  bySource: {},          // source id -> train[]
  sourceStatus: {},      // source id -> { status, error, at }
  trains: new Map(),     // id -> train (merged)
  display: new Map(),    // id -> { lat, lon } currently drawn
  hidden: new Set(store.get("tt-hidden", [])),
  selected: null,        // selected train id
  stations: new Map(),   // merged station id -> station
  station: null,         // selected station id
  railroad: null,        // railroad whose page is open
  trackSheet: null,      // { id, key, from, riding }: the track sheet, open for a train: the stop to get off (or track to), where the rider got on, and whether they're riding it
  rideAsks: store.get("tt-ride-asks", []), // rides that ended without the rider's location matching the train: "Were you on it?"
  line: null,            // ...and the line, on a line's page
  predictions: null,     // live MBTA predictions for the selected station
  showStations: store.get("tt-stations", true),
  // Mark trains late when GPS shows a delay their railroad hasn't reported
  // (js/delays.js).
  inferDelays: store.get("tt-infer", true),
  // Point trains whose feed has no heading toward their next stop.
  inferHeading: store.get("tt-infer-heading", true),
  // What each train's plate on the map says: "number", "line" or "none"
  // (plates only on the selected and tracked trains).
  labels: store.get("tt-labels", "number"),
  // Leave out trains placed from timetables rather than GPS.
  hideEstimated: store.get("tt-hide-estimated", false),
  // While tracking a train, show only the tracked ones (and the selected one).
  onlyTracked: store.get("tt-only-tracked", true),
  // The car tapped in the selected train's drawing: { id (train), i (car),
  // page (its full model page instead of the train) }, or null.
  car: null,
  // A station's page lists departures or arrivals.
  stationView: "dep",
  // The open station's notices and (NJ Transit) its departure board's tracks:
  // { id, notices: [...], tracks: Map(train number -> track) }.
  stationExtras: null,
  // Times as 18:05 instead of 6:05 PM.
  clock24: store.get("tt-clock24", false),
  // Times shown in: "" the viewer's own zone, "station" each stop's local
  // time, or an IANA zone.
  timeZone: store.get("tt-tz", ""),
  // Miles or kilometers. The default follows the browser's language: miles in
  // the few countries that still use them, kilometers everywhere else.
  units: store.get("tt-units", /-(US|GB|LR|MM)\b/i.test(navigator.language || "en-US") ? "mi" : "km"),
  // Trains the viewer is following (saved in the browser):
  // [{ id, agency, number, route, stopKey, stopName, eta, lastSeen }]
  tracked: store.get("tt-tracked", []),
  recents: store.get("tt-recents", []), // [{ kind: train|station|railroad|line, id, agency?, name, number? }]
  // Service notices folded down to their heading until opened (remembered
  // across trains).
  noticesCollapsed: store.get("tt-notices-collapsed", true),
  // Railroad page sections folded to their heading (remembered).
  rrCollapsed: new Set(store.get("tt-rr-collapsed", [])),
  servedOpen: new Set(),  // railroads whose lines are unfolded on station pages
  liftsOpen: false,      // a station's working elevators and escalators unfolded
  notices: { id: null, list: [], at: 0 }, // official notices for the selected train
  crowd: null,           // { id, at, data }: the selected NJ Transit train's crowding (relay /njt-crowd)
  est: new Map(),        // train id -> position on the track { lat, lon, bearing }
  rail: null,            // RailIndex (routing and snapping; uses every track)
  railGeo: null,         // rail.geojson as loaded; drawn filtered by railCollection()
  stopPos: new Map(),    // station member key -> { lat, lon }
  stopByName: new Map(), // "agency:normalized name" -> { lat, lon }
  follow: false,
  query: "",
  filters: { kind: "", country: "", region: "", agency: "" }, // search's: type, country, network, railroad
  upcomingOpen: null,    // a train later today whose stops are shown in search ("railroad|number|day|departure")
  relayFeeds: null,      // feeds the relay can serve (null = no relay)
  // The train a rider pressing locate seems to be on: { id, mph, at }.
  rideGuess: null,
  // Statuses told apart by shape as well as color, in colors that work
  // with red-green colorblindness (css/design.css).
  colorblind: store.get("tt-colorblind", false),
  // The panel's page: "trips" (My trips), "browse" or "history" (Pages,
  // below). Signed in, it opens on My trips; otherwise on Browse.
  tab: "browse",
  historyYear: "",       // History's year ("" for every year)
  routeDay: null,        // Browse's day for the trains from one station to another (YYYY-MM-DD; null for today)
};
const pastOpen = new Set(); // trains whose passed stops are unfolded
let goingBack = false; // going back doesn't count as opening something (for Recents)
let islandsShown = new Map(); // tracked train id -> when its island first showed
// On phones the tracked trains sit at the top of the sheet, as they used to:
// floating over the map, they'd cover the expanded sheet's top.
if (matchMedia("(max-width: 720px)").matches) document.getElementById("panel")?.insertBefore(document.getElementById("tracked"), document.getElementById("view-list"));

// ---------- Theme ----------

const prefersDark = matchMedia("(prefers-color-scheme: dark)");
// "auto" follows the device's light/dark setting.
let themePref = store.get("tt-theme", "auto");
const resolveTheme = () => (themePref === "auto" ? (prefersDark.matches ? "dark" : "light") : themePref);
let theme = resolveTheme();
document.documentElement.dataset.theme = theme;
document.documentElement.toggleAttribute("data-colorblind", state.colorblind);

// ---------- Map ----------

const isPhone = matchMedia("(max-width: 720px)").matches;
const map = new maplibregl.Map({
  container: "map",
  style: STYLES[theme],
  center: [-96.5, 38.6],
  zoom: isPhone ? 2.6 : 3.7,
  minZoom: 2,
  maxZoom: 17,
  hash: "map",
  attributionControl: { compact: true },
  dragRotate: false,
  pitchWithRotate: false,
});
map.touchZoomRotate.disableRotation();
// The map's credits show in full at first, as MapLibre has them, then fold
// to their ⓘ a few seconds in (MapLibre folds them at the first drag).
map.once("idle", () => setTimeout(() => {
  const el = document.querySelector(".maplibregl-ctrl-attrib.maplibregl-compact-show");
  el?.classList.remove("maplibregl-compact-show");
  el?.removeAttribute("open");
}, 5000));
map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
const geolocate = new maplibregl.GeolocateControl({ fitBoundsOptions: { maxZoom: 10 } });
map.addControl(geolocate, "bottom-right");
geolocate.on("geolocate", () => watchRide()); // Which train am I on?
// A scale bar in the chosen units, beside the panel (see design.css).
const scaleBar = new maplibregl.ScaleControl({ maxWidth: 88, unit: state.units === "km" ? "metric" : "imperial" });
map.addControl(scaleBar, "bottom-left");

// Marker images are drawn on a canvas once per agency color: an arrow for
// trains heading a known way, and a dot for the rare train whose direction
// can't be worked out at all.
function markerImage(color, withArrow) {
  const ratio = 2, size = 44, c = document.createElement("canvas");
  c.width = c.height = size * ratio;
  const g = c.getContext("2d");
  g.scale(ratio, ratio);
  const cx = size / 2, cy = size / 2, r = 7.5;
  g.lineJoin = "round";
  g.shadowColor = "rgba(0,0,0,0.3)";
  g.shadowBlur = 3;
  g.shadowOffsetY = 0.5;
  if (withArrow) {
    // Arrowhead centered on the train, pointing north; MapLibre rotates it.
    g.beginPath();
    g.moveTo(cx, cy - 10);
    g.lineTo(cx + 7.5, cy + 8);
    g.lineTo(cx, cy + 4);
    g.lineTo(cx - 7.5, cy + 8);
    g.closePath();
    g.lineWidth = 3;
    g.strokeStyle = "#fff";
    g.stroke();
    g.shadowColor = "transparent";
    g.fillStyle = color;
    g.fill();
    return { image: g.getImageData(0, 0, c.width, c.height), ratio };
  }
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fillStyle = "#fff";
  g.fill();
  g.shadowColor = "transparent";
  g.beginPath();
  g.arc(cx, cy, r - 2, 0, Math.PI * 2);
  g.fillStyle = color;
  g.fill();
  return { image: g.getImageData(0, 0, c.width, c.height), ratio };
}

// A rounded tag that stretches around a label: the callout for whatever is
// selected. One per railroad color, plus one for stations.
function tagImage(fill) {
  const ratio = 2, w = 48, h = 36, c = document.createElement("canvas");
  c.width = w * ratio;
  c.height = h * ratio;
  const g = c.getContext("2d");
  g.scale(ratio, ratio);
  g.shadowColor = "rgba(0,0,0,0.28)";
  g.shadowBlur = 4;
  g.shadowOffsetY = 1;
  g.beginPath();
  g.roundRect(4, 3, w - 8, h - 8, 9);
  g.fillStyle = fill;
  g.fill();
  return {
    image: g.getImageData(0, 0, c.width, c.height),
    options: {
      pixelRatio: ratio,
      stretchX: [[14 * ratio, 34 * ratio]],
      stretchY: [[13 * ratio, 18 * ratio]],
      content: [11 * ratio, 6 * ratio, 37 * ratio, 25 * ratio],
    },
  };
}

// Each train's label on the map: a small number plate like the one in the
// panel, white with a black outline and the railroad's color across the top.
// It stretches sideways to fit the number.
function plateImage(color) {
  const ratio = 2, w = 32, h = 30, c = document.createElement("canvas");
  c.width = w * ratio;
  c.height = h * ratio;
  const g = c.getContext("2d");
  g.scale(ratio, ratio);
  const x = 2, y = 1, pw = 28, ph = 26, band = 4, r = 4;
  g.save();
  g.shadowColor = "rgba(0,0,0,0.25)";
  g.shadowBlur = 3;
  g.shadowOffsetY = 1;
  g.beginPath();
  g.roundRect(x, y, pw, ph, r);
  g.fillStyle = "#fff";
  g.fill();
  g.restore();
  g.save();
  g.beginPath();
  g.roundRect(x, y, pw, ph, r);
  g.clip();
  g.fillStyle = color;
  g.fillRect(x, y, pw, band);
  g.restore();
  g.beginPath();
  g.roundRect(x + 0.6, y + 0.6, pw - 1.2, ph - 1.2, r - 0.6);
  g.lineWidth = 1.2;
  g.strokeStyle = "#121417";
  g.stroke();
  return {
    image: g.getImageData(0, 0, c.width, c.height),
    options: {
      pixelRatio: ratio,
      stretchX: [[8 * ratio, 24 * ratio]],
      stretchY: [[10 * ratio, 21 * ratio]],
      content: [6 * ratio, (y + band + 1) * ratio, 26 * ratio, (y + ph - 3) * ratio],
    },
  };
}

function addImages() {
  for (const [id, a] of Object.entries(AGENCIES)) {
    const name = `tt-plate-${id}`;
    if (!map.hasImage(name)) {
      const { image, options } = plateImage(a.color);
      map.addImage(name, image, options);
    }
  }
  if (!map.hasImage("tt-tag-station")) {
    const { image, options } = tagImage(theme === "dark" ? "#eceef1" : "#1b1d21");
    map.addImage("tt-tag-station", image, options);
  }
  for (const [id, a] of Object.entries(AGENCIES)) {
    for (const arrow of [true, false]) {
      const name = `tt-${id}-${arrow ? "arrow" : "dot"}`;
      if (map.hasImage(name)) continue;
      const { image, ratio } = markerImage(a.color, arrow);
      map.addImage(name, image, { pixelRatio: ratio });
    }
  }
}

function themeColors() {
  return theme === "dark"
    ? { text: "#eceef1", halo: "rgba(21,23,27,0.92)", rail: "#8d9ab0", railCommuter: "#66728a", railCasing: "rgba(0,0,0,0.5)",
        stationFill: "#1c1f24", stationText: "#b9bfc8", railOpacity: 0.85, footprintOpacity: 0.18, stateBorder: "rgba(160,170,185,0.35)" }
    : { text: "#1b1d21", halo: "rgba(255,255,255,0.95)", rail: "#5d6675", railCommuter: "#8d95a3", railCasing: "rgba(255,255,255,0.9)",
        stationFill: "#ffffff", stationText: "#4a505a", railOpacity: 0.8, footprintOpacity: 0.1, stateBorder: "rgba(90,100,115,0.35)" };
}

// Train markers by zoom, the same for every railroad. The selected and tracked
// trains draw larger: the whole marker grows rather than gaining a halo. Their
// plates sit a little further out to clear it.
const SELECTED_SCALE = 1.4;
// Pings: filled circles in the marker's color, animated by ping() below.
// Their paint is set every frame, so MapLibre's own easing between values is
// off (it would show the snap back to the small size as a shrink).
const NO_EASING = { duration: 0, delay: 0 };
const PING_PAINT = {
  "circle-radius": 12, "circle-color": ["get", "color"], "circle-opacity": 0,
  "circle-radius-transition": NO_EASING, "circle-opacity-transition": NO_EASING,
};
function trainIconSize(highlighted = false) {
  const sized = (v) => ["*", ["case", highlighted, SELECTED_SCALE, 1], v];
  return ["interpolate", ["linear"], ["zoom"], 2, sized(0.5), 5, sized(0.68), 8, sized(0.85), 12, sized(1)];
}
const PLATE_OFFSET = ["left", [1.55, 0], "right", [-1.55, 0], "top", [0, 1.7], "bottom", [0, -1.45]];
const PLATE_OFFSET_SELECTED = ["left", [1.95, 0], "right", [-1.95, 0], "top", [0, 2.1], "bottom", [0, -1.85]];
function plateOffset(highlighted = false) {
  return ["case", highlighted, ["literal", PLATE_OFFSET_SELECTED], ["literal", PLATE_OFFSET]];
}

// A marker's radius by zoom, for the ping rings and the selected station's disc.
const DISC_STOPS = [[2, 0.5], [5, 0.68], [8, 0.85], [12, 1]].map(([z, k]) => [z, 7.5 * k * 1.12 + 1.5]);
function discRadius(extra = 0) {
  return ["interpolate", ["linear"], ["zoom"], ...DISC_STOPS.flatMap(([z, r]) => [z, r + extra])];
}
function discRadiusAt(z) {
  const s = DISC_STOPS;
  if (z <= s[0][0]) return s[0][1];
  for (let i = 1; i < s.length; i++) {
    if (z <= s[i][0]) return s[i - 1][1] + ((z - s[i - 1][0]) / (s[i][0] - s[i - 1][0])) * (s[i][1] - s[i - 1][1]);
  }
  return s[s.length - 1][1];
}

// ---------- Fading in ----------
// Track, stations and trains fade in as they arrive instead of popping in.
// Each feature names its group ("g", a railroad), and a group that wasn't
// drawn a moment ago is drawn at its feature-state "f", eased from 0 to 1.
// None fades in before the basemap has drawn, and while a region's track or
// stations, or a railroad's first trains, are still on the way (a move that
// brings several countries in) they wait for one another, up to FADE_HOLD_MS.
const FADE_MS = 450, FADE_HOLD_MS = 1500;
const FADE = ["coalesce", ["feature-state", "f"], 1];
let drawnGroups = {}; // source -> the groups drawn in it
let fadeWaiting = new Map(); // "source|group" -> [source, group], at 0
let fadeWaitingSince = 0, fadeTimer = 0, fadeTurn = 0;
const fadeTurns = new Map(); // "source|group" -> the fade easing it
let arriving = 0; // region files and first feeds on their way
let basemapDrawn = false;
map.once("load", () => (basemapDrawn = true));
setTimeout(() => (basemapDrawn = true), 5000); // a slow basemap holds nothing up for long
// Counts a fetch the fades wait on while it's out.
function arrival(promise) {
  arriving++;
  const done = () => {
    arriving--;
    startFades();
  };
  promise.then(done, done);
  return promise;
}
const groupsOf = (collection) => new Set(collection.features.map((f) => f.properties.g));
// A source added with what it holds drawn as it is (a theme change redraws
// the map without fading it back in).
function addFadedSource(id, collection, opts = {}) {
  map.addSource(id, { type: "geojson", data: collection, promoteId: "g", ...opts });
  drawnGroups[id] = groupsOf(collection);
}
function setFaded(id, collection) {
  const src = map.getSource(id);
  if (!src) return;
  const groups = groupsOf(collection), drawn = drawnGroups[id] || new Set();
  for (const g of groups) {
    if (drawn.has(g) || fadeWaiting.has(`${id}|${g}`)) continue;
    map.setFeatureState({ source: id, id: g }, { f: 0 });
    fadeWaiting.set(`${id}|${g}`, [id, g]);
    fadeTurns.delete(`${id}|${g}`); // a fade still easing it stops
  }
  drawnGroups[id] = groups;
  src.setData(collection);
  startFades();
}
function startFades() {
  clearTimeout(fadeTimer);
  if (!fadeWaiting.size) return;
  fadeWaitingSince ||= performance.now();
  if (!basemapDrawn || (arriving > 0 && performance.now() - fadeWaitingSince < FADE_HOLD_MS)) {
    fadeTimer = setTimeout(startFades, 100);
    return;
  }
  const batch = [...fadeWaiting], turn = ++fadeTurn;
  fadeWaiting = new Map();
  fadeWaitingSince = 0;
  for (const [k] of batch) fadeTurns.set(k, turn);
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const t0 = performance.now();
  const step = () => {
    const k = still ? 1 : Math.min(1, (performance.now() - t0) / FADE_MS);
    for (const [key, [source, id]] of batch) {
      if (fadeTurns.get(key) !== turn || !map.getSource(source)) continue;
      if (k < 1) map.setFeatureState({ source, id }, { f: 1 - (1 - k) ** 3 });
      else {
        map.removeFeatureState({ source, id }, "f");
        fadeTurns.delete(key);
      }
    }
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
// A station's or train's opacity (base, at most): one spread out to a later
// zoom (its "z") is drawn from a zoom before it, fading in to be whole there
// (the zoom buttons land on whole zooms). Too faint to see, it isn't hovered
// or tapped (shownAt).
function zoomFade(from, base = 1) {
  const stops = [];
  for (let k = Math.floor(from) - 1; k <= ALL_SHOWN; k++) stops.push(k, ["*", base, ["case", [">", ["get", "z"], k], 0, 1], FADE]);
  return ["interpolate", ["linear"], ["zoom"], ...stops];
}
const shownAt = (f) => !(f.properties.z > map.getZoom() + 0.5);
// A station or train shown from the zoom before its own, fading in (zoomFade).
const SHOWN_FROM_Z = [">=", ["zoom"], ["-", ["get", "z"], 1]];

const MUTED_LAYERS = /^(transportation|building|landuse|landcover|park|aeroway)$/;
function addLayers() {
  drawnGroups = {};
  fadeWaiting = new Map();
  fadeTurns.clear();
  addImages();
  const colors = themeColors();
  // Our layers go above every basemap shape (roads, buildings, water) but below
  // its remaining labels. Styles differ: the dark one puts a label early and
  // draws roads after it, so "before the first label" would bury the rails.
  const baseLayers = map.getStyle().layers;
  let lastShape = -1;
  baseLayers.forEach((l, i) => { if (l.type !== "symbol") lastShape = i; });
  const firstSymbol = baseLayers[lastShape + 1]?.id; // undefined = top of the stack
  // Keep the basemap quiet: of its labels only country and state names stay
  // (station names are the rest of the text); none of its rail layers (ours
  // replace them; its own draw every yard and siding up close); and its
  // sub-national borders give way to our state borders below (the light
  // style mixes in county lines and only starts at zoom 8).
  for (const l of map.getStyle().layers) {
    const keepLabel = l.type === "symbol" && /^(label|place)_(country|state)/.test(l.id);
    if ((l.type === "symbol" && !keepLabel) || /^railway/.test(l.id) || /^boundary_(3|state)$/.test(l.id)) {
      map.setLayoutProperty(l.id, "visibility", "none");
    } else if (MUTED_LAYERS.test(l["source-layer"] || "")) {
      // Roads, buildings and land use stay in the background, so the rail
      // lines carry the color.
      if (l.type === "line") map.setPaintProperty(l.id, "line-opacity", 0.4);
      else if (l.type === "fill") map.setPaintProperty(l.id, "fill-opacity", 0.35);
    }
  }
  map.addLayer({
    id: "tt-state-borders",
    type: "line",
    source: "openmaptiles",
    "source-layer": "boundary",
    filter: ["all", ["==", ["get", "admin_level"], 4], ["!=", ["get", "maritime"], 1]],
    layout: { "line-join": "round" },
    paint: {
      "line-color": colors.stateBorder,
      "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.6, 8, 1.1, 12, 1.6],
      "line-dasharray": [3, 2],
    },
  }, firstSymbol);

  // Passenger rail network (USDOT NTAD), colored by the railroads that run on
  // each stretch. Track shared by several railroads (up to three) is drawn as
  // parallel strands, one color each, centered on the real alignment.
  addFadedSource("rail", railCollection(), { tolerance: 0.6 });
  const STRAND = [[3, 1], [6, 1.6], [9, 2.4], [12, 3.4], [15, 5]]; // [zoom, strand width px]
  const byZoom = (f) => ["interpolate", ["linear"], ["zoom"], ...STRAND.flatMap(([z, w]) => [z, f(w)])];
  map.addLayer({
    id: "tt-rail-casing",
    type: "line",
    source: "rail",
    minzoom: 6,
    filter: ["!", ["has", "h"]], // hidden pieces are parallel duplicates kept for routing
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": colors.railCasing, "line-width": byZoom((w) => ["+", ["*", ["get", "n"], w], 2]), "line-opacity": FADE },
  }, firstSymbol);
  ["a", "b", "c"].forEach((prop, slot) => {
    map.addLayer({
      id: `tt-rail-${slot}`,
      type: "line",
      source: "rail",
      filter: ["all", [">", ["get", "n"], slot], ["!", ["has", "h"]]],
      layout: { "line-join": "round", "line-cap": "butt" },
      paint: {
        "line-color": networkColor(prop),
        "line-opacity": ["*", colors.railOpacity, FADE],
        "line-width": byZoom((w) => w),
        // Strand i of n sits (i - (n-1)/2) strand-widths off the centerline.
        "line-offset": byZoom((w) => ["*", ["-", slot, ["/", ["-", ["get", "n"], 1], 2]], w]),
      },
    }, firstSymbol);
  });
  // A railroad's or a line's track, lit up while its page is open
  // (applyFocus): a soft glow under the strands, a solid line over them.
  map.addSource("focus", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  map.addLayer({
    id: "tt-focus-glow",
    type: "line",
    source: "focus",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": ["get", "color"], "line-opacity": 0.22, "line-width": byZoom((w) => w * 6) },
  }, "tt-rail-casing");
  map.addLayer({
    id: "tt-focus-line",
    type: "line",
    source: "focus",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": ["get", "color"], "line-width": byZoom((w) => w * 1.8) },
  }, firstSymbol);
  // Disruptions: where a railroad says no trains are running right now, the
  // track's colored strands give way to a thin broken line in the
  // railroad's color, as a line with no service is drawn on transit maps. A
  // strip in the map's own background color covers the strands first, so
  // nothing shows between the dashes; from city zoom a label says what's
  // happening ("Buses replace trains").
  const land = baseLayers.find((l) => l.type === "background")?.paint?.["background-color"] || (theme === "dark" ? "#0c0c0c" : "#f2f3f0");
  map.addSource("disruptions", { type: "geojson", data: { type: "FeatureCollection", features: disruptionFeatures() } });
  map.addLayer({
    id: "tt-disruption-gap",
    type: "line",
    source: "disruptions",
    layout: { "line-join": "round", "line-cap": "butt" },
    paint: { "line-color": land, "line-width": byZoom((w) => w * 3 + 3) },
  }, firstSymbol);
  map.addLayer({
    id: "tt-disruption-line",
    type: "line",
    source: "disruptions",
    layout: { "line-join": "round", "line-cap": "butt" },
    paint: { "line-color": ["get", "color"], "line-opacity": 0.7, "line-width": byZoom((w) => w * 0.8 + 0.5), "line-dasharray": [2, 1.6] },
  }, firstSymbol);
  map.addLayer({
    id: "tt-disruption-label",
    type: "symbol",
    source: "disruptions",
    minzoom: 9,
    layout: {
      "symbol-placement": "line",
      "symbol-spacing": 320,
      "text-field": ["get", "label"],
      "text-font": ["Noto Sans Regular"],
      "text-size": 11,
      "text-offset": [0, -1.1],
      "text-max-angle": 30,
    },
    paint: { "text-color": colors.stationText, "text-halo-color": colors.halo, "text-halo-width": 1.5 },
  });
  // The selected train's route: the part it has run faded, the part ahead
  // solid, in its line's color, over the track (redrawRoute).
  map.addSource("route", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  map.addLayer({
    id: "tt-route-behind",
    type: "line",
    source: "route",
    filter: ["==", ["get", "part"], "behind"],
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": ["get", "color"], "line-opacity": 0.35, "line-width": byZoom((w) => w * 1.6 + 1) },
  }, firstSymbol);
  map.addLayer({
    id: "tt-route-ahead",
    type: "line",
    source: "route",
    filter: ["==", ["get", "part"], "ahead"],
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": ["get", "color"], "line-width": byZoom((w) => w * 2.2 + 1.5) },
  }, firstSymbol);
  // Other main-line track (freight) from the basemap, faintly, when zoomed in.
  // Yards, sidings and spurs are left out; they turn terminals into a tangle.
  map.addLayer({
    id: "tt-rail-other",
    type: "line",
    source: "openmaptiles",
    "source-layer": "transportation",
    minzoom: 10,
    filter: ["all", ["==", ["get", "class"], "rail"], ["!", ["has", "service"]]],
    paint: { "line-color": colors.railCommuter, "line-opacity": 0.45, "line-width": 1 },
  }, "tt-rail-casing");

  // Outlines of major terminals (platforms and building), from city zoom.
  map.addSource("footprints", { type: "geojson", data: footprintCollection() });
  map.addLayer({
    id: "tt-footprint-fill",
    type: "fill",
    source: "footprints",
    minzoom: 11.5,
    layout: { visibility: state.showStations ? "visible" : "none" },
    paint: { "fill-color": ["get", "color"], "fill-opacity": ["interpolate", ["linear"], ["zoom"], 11.5, 0, 12.5, colors.footprintOpacity] },
  }, "tt-rail-casing");
  map.addLayer({
    id: "tt-footprint-line",
    type: "line",
    source: "footprints",
    minzoom: 11.5,
    layout: { visibility: state.showStations ? "visible" : "none", "line-join": "round" },
    paint: {
      "line-color": ["get", "color"],
      "line-width": ["interpolate", ["linear"], ["zoom"], 12, 1, 16, 2],
      "line-opacity": ["interpolate", ["linear"], ["zoom"], 11.5, 0, 12.5, 0.75],
    },
  }, firstSymbol);

  // Stations sit under the trains. Intercity stops appear from regional zoom,
  // commuter stops once you're looking at a metro area.
  addFadedSource("stations", stationCollection());
  const stationPaint = (r, from) => ({
    "circle-radius": r,
    "circle-color": colors.stationFill,
    "circle-stroke-color": ["get", "color"],
    "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 5, 1.3, 12, 2.2],
    "circle-opacity": zoomFade(from),
    "circle-stroke-opacity": zoomFade(from),
  });
  // Each station from the zoom before the one stationCollection() spreads it
  // out to (fading in, see zoomFade), and its name from that zoom.
  const spreadTo = (prop) => (prop === "z" ? SHOWN_FROM_Z : [">=", ["zoom"], ["get", prop]]);
  map.addLayer({
    id: "tt-stations-minor",
    layout: { visibility: state.showStations ? "visible" : "none" },
    type: "circle",
    source: "stations",
    minzoom: DOT_FLOOR.minor,
    filter: ["all", ["!", ["get", "major"]], spreadTo("z")],
    paint: stationPaint(["interpolate", ["linear"], ["zoom"], 8, 2.2, 12, 5, 15, 7], DOT_FLOOR.minor),
  });
  map.addLayer({
    id: "tt-stations-major",
    layout: { visibility: state.showStations ? "visible" : "none" },
    type: "circle",
    source: "stations",
    minzoom: DOT_FLOOR.major,
    filter: ["all", ["get", "major"], spreadTo("z")],
    paint: stationPaint(["interpolate", ["linear"], ["zoom"], 4.5, 1.8, 8, 3.6, 12, 6, 15, 8], DOT_FLOOR.major),
  });
  // Selected station: a ping, a soft shadow, then a white disc ringed in the
  // station's color, lifted above the map.
  const stationSel = ["==", ["get", "id"], ""];
  map.addLayer({
    id: "tt-station-ping",
    type: "circle",
    source: "stations",
    filter: stationSel,
    paint: PING_PAINT,
  });
  map.addLayer({
    id: "tt-station-shadow",
    type: "circle",
    source: "stations",
    filter: stationSel,
    paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 9, 12, 14], "circle-color": "#000", "circle-opacity": 0.22, "circle-blur": 0.9, "circle-translate": [0, 1] },
  });
  map.addLayer({
    id: "tt-station-selected",
    type: "circle",
    source: "stations",
    filter: stationSel,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 6, 12, 10],
      "circle-color": colors.stationFill,
      "circle-stroke-color": ["get", "color"],
      "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 4, 2.5, 12, 3.5],
    },
  });
  // Station names (most of the basemap's place names are hidden), spread
  // out as stationCollection() does: the busiest stations' from 4.5,
  // intercity stations' from 7 and the rest from 9 where there's room. Labels
  // that would collide are dropped, busiest stations first in line.
  map.addLayer({
    id: "tt-station-labels",
    type: "symbol",
    source: "stations",
    minzoom: LABEL_FLOOR.top,
    filter: spreadTo("lz"),
    layout: {
      "text-field": ["get", "name"],
      "text-font": ["case", ["get", "top"], ["literal", ["Noto Sans Bold"]], ["literal", ["Noto Sans Regular"]]],
      "text-size": ["interpolate", ["linear"], ["zoom"], 4.5, 10, 9, 11, 15, 13],
      "text-max-width": 8,
      "text-variable-anchor": ["top", "bottom", "right", "left"],
      "text-radial-offset": ["interpolate", ["linear"], ["zoom"], 4.5, 0.6, 12, 0.9],
      "text-padding": 3,
      "symbol-sort-key": ["-", ["get", "rank"]],
      visibility: state.showStations ? "visible" : "none",
    },
    paint: {
      "text-color": ["case", ["get", "major"], colors.text, colors.stationText],
      "text-halo-color": colors.halo,
      "text-halo-width": 1.5,
      "text-opacity": FADE, // and MapLibre's own fade as a name comes in
    },
  });


  // A selected terminal's outline is drawn bolder.
  map.addLayer({
    id: "tt-footprint-selected",
    type: "line",
    source: "footprints",
    filter: stationSel,
    layout: { "line-join": "round" },
    paint: { "line-color": ["get", "color"], "line-width": ["interpolate", ["linear"], ["zoom"], 11, 2, 16, 3.5] },
  }, "tt-station-ping");

  addFadedSource("trains", featureCollection());

  // Selected and tracked trains: a ping ring under an enlarged marker.
  const trainSel = ["==", ["get", "id"], ""];
  map.addLayer({
    id: "tt-ping",
    type: "circle",
    source: "trains",
    filter: trainSel,
    paint: PING_PAINT,
  });

  map.addLayer({
    id: "tt-trains",
    type: "symbol",
    source: "trains",
    layout: {
      "icon-image": ["concat", "tt-", ["get", "agency"], ["case", ["get", "hasBearing"], "-arrow", "-dot"]],
      "icon-size": trainIconSize(),
      "icon-rotate": ["get", "bearing"],
      "icon-rotation-alignment": "map",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "symbol-sort-key": ["get", "drawOrder"],
    },
    filter: SHOWN_FROM_Z, // spread out by importance (spreadTrains)
    paint: { "icon-opacity": zoomFade(TRAIN_FLOOR, ["case", ["get", "stale"], 0.45, 1]) },
  });

  // Each train is labeled with its plate once there's room for it. Plates
  // collide with each other instead of piling up, and intercity trains win
  // ties. The selected and tracked trains' plates are placed first and shown
  // at every zoom (see applySelectionFilter); they stay in this layer so
  // selecting a train never makes its plate blink.
  map.addLayer({
    id: "tt-labels",
    type: "symbol",
    source: "trains",
    filter: ["all", [">=", ["zoom"], 8], [">=", ["zoom"], ["get", "z"]]], // zoomed further out, trains are unlabeled arrows
    layout: {
      "text-field": ["get", "plate"],
      "text-font": ["Noto Sans Bold"],
      "text-size": ["interpolate", ["linear"], ["zoom"], 8, 11, 12, 12],
      // Beside the marker, clear of the white rim; the first one that fits wins.
      "text-variable-anchor-offset": plateOffset(),
      "icon-image": ["concat", "tt-plate-", ["get", "agency"]], // fitted around the number
      "icon-text-fit": "both",
      "icon-text-fit-padding": [0.5, 3, 0.5, 3],
      "text-padding": 2,
      "symbol-sort-key": ["get", "labelOrder"],
    },
    paint: { "text-color": "#121417", "text-opacity": FADE, "icon-opacity": FADE },
  });

  map.addLayer({
    id: "tt-station-selected-label",
    type: "symbol",
    source: "stations",
    filter: stationSel,
    layout: {
      "text-field": ["get", "name"],
      "text-font": ["Noto Sans Bold"],
      "text-size": 13,
      "text-anchor": "bottom",
      "text-offset": [0, -2.2],
      "icon-image": "tt-tag-station", // fitted around the text, so it moves with it
      "icon-text-fit": "both",
      "icon-text-fit-padding": [3, 8, 3, 8],
      "text-allow-overlap": true,
      "icon-allow-overlap": true,
      // Always shown, and other labels placed after it move out of its way.
      "text-ignore-placement": false,
      "icon-ignore-placement": false,
    },
    paint: { "text-color": theme === "dark" ? "#16181c" : "#ffffff" },
  });


  applySelectionFilter();
}

map.on("style.load", () => {
  addLayers();
  applyFocus();
});

// Start with the attribution folded into its ⓘ button.
map.once("load", () => {
  const attrib = document.querySelector(".maplibregl-ctrl-attrib");
  attrib?.classList.remove("maplibregl-compact-show");
  attrib?.removeAttribute("open");
});

// ---------- Train features ----------

// Trains in lists (search, a station's trains): every train of the railroads
// switched on. The map-only settings (only tracked trains, hiding estimated
// ones) don't apply.
const inLists = (t) => !state.hidden.has(t.agency);

// Trains drawn on the map.
function visible(t) {
  // A train's page (opened from the map, a list or a tracked train) shows
  // that train alone; closing it brings the others back.
  if (state.selected) return t.id === state.selected;
  if (state.hidden.has(t.agency)) return false;
  // A railroad's page (and its lines') shows only its trains.
  if (state.railroad && t.agency !== state.railroad) return false;
  // The selected and tracked trains always show.
  if (t.id === state.selected || state.tracked.some((r) => r.id === t.id)) return true;
  if (state.onlyTracked && state.tracked.length) return false;
  return !(state.hideEstimated && t.estimated);
}

// A train's line, shortened for its plate ("Northeast Corridor",
// "Fall River/New Bedford"); its number when it has no line.
const shortLine = (t) => (t.route || "").replace(/\s+(Line|Branch)$/i, "").trim() || t.number || AGENCIES[t.agency].short;

// How much a train matters on a map zoomed out, from its run rather than its
// railroad's kind: how far it goes (its stops joined up) and how far apart it
// stops. An AVE (550 km, a stop every 110) or the California Zephyr comes
// first, then an Ex across Czechia (360 km, every 23), a regional (130 km,
// every 15), and last a local stopping every couple of kilometers, whichever
// railroad runs it. Feeds drop the stops a train has passed, so a train
// keeps the best score its run has had. A train placed from the timetable,
// or whose fix is old, counts a little less; one calling at a station the
// rider has looked up a little more.
const runScores = new Map(); // train id -> { n: stops it was scored from, score }
const clamp01 = (v) => Math.max(0, Math.min(1, v));
function runScore(t) {
  const had = runScores.get(t.id);
  if (had && had.n === t.stops?.length) return had.score;
  const pts = (t.stops || []).map((s) => s.key && state.stopPos.get(s.key)).filter(Boolean);
  // Without stops placed (a feed naming only the next stop): by its railroad's kind.
  if (pts.length < 2) return had?.score ?? (AGENCIES[t.agency].kind === "intercity" ? 0.55 : 0.3);
  let path = 0;
  for (let i = 1; i < pts.length; i++) path += meters(pts[i - 1], pts[i]) / 1000;
  const every = path / (pts.length - 1);
  // 8 km to 1,000 km, and a stop every 2 km to every 90.
  const score = 0.45 * clamp01((Math.log2(Math.max(1, path)) - 3) / 7) + 0.55 * clamp01((Math.log2(Math.max(0.1, every)) - 1) / 5.5);
  runScores.set(t.id, { n: t.stops.length, score: Math.max(score, had?.score ?? 0) });
  return runScores.get(t.id).score;
}
function riderStopKeys() {
  const keys = new Set();
  for (const r of state.recents) if (r.kind === "station") for (const k of state.stations.get(r.id)?.keys || []) keys.add(k);
  return keys;
}
function importance(t, riders) {
  return runScore(t) - (t.estimated ? 0.1 : 0) - (Date.now() - t.updated > STALE_MS && !t.estimated ? 0.1 : 0) +
    (riders.size && t.stops?.some((s) => riders.has(s.key)) ? 0.25 : 0);
}

// Trains are spread out as stations are (see spreadOut): most important
// first, each from the zoom at which it's TRAIN_GAP px from every more
// important train showing by then, and every one by TRAIN_ALL. The selected
// and tracked trains show at every zoom. A train on screen keeps its place
// until another comes well inside its room, so trains passing each other
// don't blink. Worked out when the trains or which are shown change, from
// where each is heading, not on every frame of their slide.
const TRAIN_GAP = 22, TRAIN_ALL = 11, TRAIN_FLOOR = 2;
let trainZooms = new Map(), trainRanks = new Map(), trainZoomsOf = null, trainZoomsKey = "";
function spreadTrains(shown) {
  const key = [shown.length, state.selected, state.railroad, [...state.hidden].join(), state.tracked.map((r) => r.id).join(), state.onlyTracked, state.hideEstimated].join("|");
  if (trainZoomsOf === state.trains && trainZoomsKey === key) return trainZooms;
  for (const id of runScores.keys()) if (!state.trains.has(id)) runScores.delete(id);
  const riders = riderStopKeys(), pinned = new Set([state.selected, ...state.tracked.map((r) => r.id)]);
  const items = shown.map((t) => {
    const p = targetOf(t);
    return { t, pinned: pinned.has(t.id), rank: importance(t, riders), x: mercX(p.lon), y: mercY(p.lat), z: 0, clear2: 0 };
  });
  items.sort((a, b) => b.pinned - a.pinned || b.rank - a.rank || (a.t.id < b.t.id ? -1 : 1));
  const now = map.getZoom(), before = trainZooms;
  spreadOut(items, TRAIN_GAP, "z", () => TRAIN_FLOOR, {
    cap: TRAIN_ALL,
    keep: (it) => it.pinned,
    slack: (it) => ((before.get(it.t.id) ?? Infinity) <= now ? 0.7 : 1),
  });
  trainZooms = new Map(items.map((it) => [it.t.id, it.z > TRAIN_FLOOR ? it.z : 0]));
  trainRanks = new Map(items.map((it) => [it.t.id, it.rank]));
  trainZoomsOf = state.trains;
  trainZoomsKey = key;
  return trainZooms;
}

function featureCollection() {
  const features = [];
  const shown = [...state.trains.values()].filter(visible), zooms = spreadTrains(shown);
  for (const t of shown) {
    const pos = state.display.get(t.id) || targetOf(t), rank = trainRanks.get(t.id) || 0;
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [pos.lon, pos.lat] },
      properties: {
        id: t.id,
        agency: t.agency,
        color: AGENCIES[t.agency].color,
        plate: state.labels === "line" ? shortLine(t) : t.number || AGENCIES[t.agency].short,
        bearing: targetOf(t).bearing ?? 0,
        hasBearing: targetOf(t).bearing != null,
        stale: Date.now() - t.updated > STALE_MS && !t.estimated,
        drawOrder: rank, // the more important on top
        labelOrder: -rank, // and its plate placed first
        z: zooms.get(t.id) || 0, // shown from (see spreadTrains)
        g: t.agency,
      },
    });
  }
  return { type: "FeatureCollection", features };
}

function redraw() {
  setFaded("trains", featureCollection());
}

// ---------- The selected train's route ----------
// Its stops joined along the track, split where the train is: behind it
// faded, ahead solid. Traced once per train (and stop list), split again on
// every update. A train far off that line is on a detour its stop list
// doesn't show (VIA's Hudson Bay train around washouts on the Dauphin line,
// running the CN main through Melville and Rivers instead), or its fix is
// stale and it's still short of stops its feed already counts as passed:
// either way its current leg is traced again through where it is, from the
// stop behind it and on to the next, so the line follows the track it's
// really on.
const DETOUR_M = 2000;
const routeCache = { key: "", stops: [], legs: [], coords: [] }; // legs[i] joins stops[i] and stops[i + 1]
const detourCache = { key: "", coords: [] };

// The track from one point to the next, or a straight line where the track
// doesn't join them within reason.
function traceLeg(a, b, agency) {
  const path = state.rail.route(state.rail.snap([a.lon, a.lat], 1500, agency), state.rail.snap([b.lon, b.lat], 1500, agency), agency);
  return path && path.length < meters(a, b) * 2.5 + 2000 ? path.coords : [[a.lon, a.lat], [b.lon, b.lat]];
}

const joinLegs = (legs) => legs.flatMap((leg, i) => (i ? leg.slice(1) : leg));

// Meters from a point to the nearest piece of a line, not just its nearest
// vertex: on the prairies one straight piece can run 30 km.
function offLine(p, coords) {
  const kx = Math.cos((p.lat * Math.PI) / 180);
  let best = Infinity, q = null;
  for (let i = 1; i < coords.length; i++) {
    const [ax, ay] = coords[i - 1], [bx, by] = coords[i];
    const dx = (bx - ax) * kx, dy = by - ay, px = (p.lon - ax) * kx, py = p.lat - ay;
    const len2 = dx * dx + dy * dy;
    const u = len2 ? Math.max(0, Math.min(1, (px * dx + py * dy) / len2)) : 0;
    const d = (px - u * dx) ** 2 + (py - u * dy) ** 2;
    if (d < best) { best = d; q = { lon: ax + (bx - ax) * u, lat: ay + dy * u }; }
  }
  return q ? meters(p, q) : Infinity;
}

function redrawRoute() {
  const src = map.getSource("route");
  if (!src) return;
  const t = state.selected && state.trains.get(state.selected);
  const empty = { type: "FeatureCollection", features: [] };
  if (!t?.stops?.length || !state.rail) return src.setData(empty);
  const key = `${t.id}|${t.stops.length}|${t.stops[0].key}|${t.stops[t.stops.length - 1].key}`;
  if (routeCache.key !== key) {
    const stops = t.stops.map((s, i) => ({ i, ...state.stopPos.get(s.key) })).filter((p) => p.lat != null);
    const legs = stops.slice(1).map((p, j) => traceLeg(stops[j], p, t.agency));
    Object.assign(routeCache, { key, stops, legs, coords: joinLegs(legs) });
  }
  let coords = routeCache.coords;
  if (coords.length < 2) return src.setData(empty);
  // Off the line by more than a detour's worth: trace its leg through it.
  // The leg is the one into the stop it's heading for, when the feed says
  // which, else the one it strays least from.
  const target = targetOf(t);
  if (offLine(target, coords) > DETOUR_M) {
    const { stops, legs } = routeCache;
    const ni = t.stops.findIndex((s) => s.status === "next");
    let leg = -1;
    if (ni >= 0) leg = stops.findIndex((p) => p.i >= ni) - 1;
    else {
      let strays = Infinity;
      legs.forEach((_, j) => {
        const d = meters(stops[j], target) + meters(target, stops[j + 1]) - meters(stops[j], stops[j + 1]);
        if (d < strays) { strays = d; leg = j; }
      });
    }
    if (leg >= 0 && leg < legs.length) {
      const dkey = `${key}|${leg}|${target.lon},${target.lat}`;
      if (detourCache.key !== dkey) {
        const via = [...traceLeg(stops[leg], target, t.agency), ...traceLeg(target, stops[leg + 1], t.agency).slice(1)];
        Object.assign(detourCache, { key: dkey, coords: joinLegs(legs.map((l, j) => (j === leg ? via : l))) });
      }
      coords = detourCache.coords;
    }
  }
  // Where the train is along it: the nearest point.
  const here = state.display.get(t.id) || targetOf(t);
  let at = 0, best = Infinity;
  coords.forEach((c, i) => {
    const d = (c[0] - here.lon) ** 2 + (c[1] - here.lat) ** 2;
    if (d < best) { best = d; at = i; }
  });
  const color = t.routeColor || AGENCIES[t.agency].color;
  const line = (part, cs) => ({ type: "Feature", geometry: { type: "LineString", coordinates: cs }, properties: { part, color } });
  const parts = [];
  if (at > 0) parts.push(line("behind", [...coords.slice(0, at + 1), [here.lon, here.lat]]));
  if (at < coords.length - 1) parts.push(line("ahead", [[here.lon, here.lat], ...coords.slice(at + 1)]));
  src.setData({ type: "FeatureCollection", features: parts });
}

function agencyShown(agency) {
  if (state.hidden.has(agency)) return false;
  const src = SOURCES.find((s) => s.agencies.includes(agency));
  return src && sourceAvailability(src).ok;
}

// Draw each station on its railroad's track: the nearest point on the track
// of its first (highest-priority) railroad within STATION_SNAP_M.
const STATION_SNAP_M = 400;
function snapStations() {
  if (!state.rail) return;
  for (const st of state.stations.values()) {
    st.draw = null;
    for (const m of st.members) {
      const s = state.rail.snap([st.lon, st.lat], STATION_SNAP_M, m.agency);
      if (s && state.rail.lines[s.line].nets.includes(m.agency)) {
        const [lon, lat] = state.rail.at(s.line, s.along).point;
        st.draw = { lon, lat };
        break;
      }
    }
  }
  redrawStations();
}
const stationPos = (st) => st.draw || st;

// A station's railroads on the map: those switched on, and on a railroad's
// or line's page only that railroad.
const stationAgencies = (st) => st.agencies.filter((a) => agencyShown(a) && (!state.railroad || a === state.railroad));

// The lines a station is on ("Kitchener line · Lakeshore West line"), for
// search: its railroads' lines, or the railroad's name where
// its stations don't name lines (Amtrak). Main lines (most stations) first;
// two, then how many more.
let lineSizes = null; // "railroad|line" -> stations on it
function lineSize(agency, line) {
  if (!lineSizes) {
    lineSizes = new Map();
    for (const s of state.stations.values()) {
      for (const m of s.members) for (const l of m.lines || []) lineSizes.set(`${m.agency}|${l}`, (lineSizes.get(`${m.agency}|${l}`) || 0) + 1);
    }
  }
  return lineSizes.get(`${agency}|${line}`) || 0;
}
function stationLinesText(st, agencies = st.agencies) {
  const out = [];
  for (const m of st.members) {
    if (!agencies.includes(m.agency)) continue;
    const named = (m.lines || []).filter((l) => l && l !== "City Terminal Zone").sort((x, y) => lineSize(m.agency, y) - lineSize(m.agency, x));
    for (const l of named.length ? named : [AGENCIES[m.agency].short]) if (!out.includes(l)) out.push(l);
  }
  return out.length > 2 ? `${out.slice(0, 2).join(" · ")} +${out.length - 2} more` : out.join(" · ");
}

// Stations are spread out so the map stays readable where a railroad stops
// everywhere (Czechia's 1,800 intercity stops), the way a basemap thins its
// place names: busiest first, each station shows from the zoom at which it
// sits STATION_GAP px from every busier one showing by then, and its name
// LABEL_GAP px from every busier name. Never before its layer's own zoom
// (intercity stations from 4.5, the rest from 8; names from 7 and 9, the
// busiest from 4.5), and every one by ALL_SHOWN. Whole zooms, as the layers'
// filters see them.
const STATION_GAP = 26, LABEL_GAP = 60, ALL_SHOWN = 13;
const DOT_FLOOR = { major: 4.5, minor: 8 }, LABEL_FLOOR = { top: 4.5, major: 7, minor: 9 };
const mercX = (lon) => (lon + 180) / 360;
const mercY = (lat) => {
  const s = Math.sin((Math.max(-85, Math.min(85, lat)) * Math.PI) / 180);
  return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
};
// Sets item[key] for each item, in order of priority: floorOf(item), or the
// first whole zoom it's gap px from every earlier item showing by then (and
// by cap, at the latest). An item kept (keep(item)) is never pushed later;
// one given slack (slack(item), below 1) can sit closer, so what's on screen
// stays there until it's well inside another's room.
function spreadOut(items, gap, key, floorOf, { cap = ALL_SHOWN, keep = () => false, slack = () => 1 } = {}) {
  // Two items further apart than this (in world widths) are gap px apart by
  // the lowest floor: a grid of it finds the rest.
  const floors = items.map(floorOf);
  const reach = gap / (512 * 2 ** floors.reduce((a, b) => Math.min(a, b), 4.5));
  // Squared, the distance two items must be apart to be gap px apart at zoom z.
  const clear2 = (z) => (gap / (512 * 2 ** z)) ** 2;
  const grid = new Map(); // cell -> items placed in it
  items.forEach((it, i) => {
    let z = floors[i];
    const room = slack(it) ** 2;
    let mine = clear2(z) * room;
    const cx = Math.floor(it.x / reach), cy = Math.floor(it.y / reach);
    for (let dx = -1; dx <= 1 && !keep(it); dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (const o of grid.get((cx + dx) * 65536 + cy + dy) || []) {
          // Too close at both their zooms: it waits until they're gap px apart.
          const d2 = (o.x - it.x) ** 2 + (o.y - it.y) ** 2;
          if (d2 >= mine || d2 >= o.clear2) continue;
          z = d2 ? Math.min(cap, Math.ceil(Math.log2(gap * Math.sqrt(room) / (512 * Math.sqrt(d2))))) : cap;
          mine = clear2(z) * room;
        }
      }
    }
    it[key] = z;
    it.clear2 = mine;
    const c = cx * 65536 + cy;
    if (!grid.has(c)) grid.set(c, []);
    grid.get(c).push(it);
  });
}

function stationCollection() {
  const items = [];
  for (const st of state.stations.values()) {
    const shown = stationAgencies(st);
    if (!shown.length) continue;
    const pos = stationPos(st);
    const major = st.major && shown.some((a) => AGENCIES[a].kind === "intercity");
    items.push({ st, shown, pos, major, top: !!st.top, x: mercX(pos.lon), y: mercY(pos.lat), dot: 0, label: 0, clear2: 0 });
  }
  items.sort((a, b) => b.top - a.top || b.st.rank - a.st.rank || (a.st.id < b.st.id ? -1 : 1));
  const dotFloor = (it) => (it.major ? DOT_FLOOR.major : DOT_FLOOR.minor);
  spreadOut(items, STATION_GAP, "dot", dotFloor);
  // A name never shows before its station, except the busiest commuter
  // stations', named before their railroads' stations show at all.
  spreadOut(items, LABEL_GAP, "label", (it) => Math.max(it.top ? LABEL_FLOOR.top : it.major ? LABEL_FLOOR.major : LABEL_FLOOR.minor, it.top && !it.major ? 0 : it.dot));
  // Drawn least busy first, so a busier station sits on top where they meet.
  const features = items.reverse().map(({ st, shown, pos, major, top, dot, label }) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [pos.lon, pos.lat] },
    properties: {
      id: st.id,
      name: st.name,
      major,
      color: AGENCIES[shown[0]].color,
      rank: st.rank,
      top,
      z: dot > dotFloor({ major }) ? dot : 0, // 0: from its layer's own zoom
      lz: label > LABEL_FLOOR.top ? label : 0,
      g: shown[0], // fades in with its railroad (see setFaded)
    },
  }));
  return { type: "FeatureCollection", features };
}

function footprintCollection() {
  const features = [];
  for (const st of state.stations.values()) {
    if (!st.footprint) continue;
    const shown = stationAgencies(st);
    if (!shown.length) continue;
    features.push({
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [st.footprint] },
      properties: { id: st.id, color: AGENCIES[shown[0]].color },
    });
  }
  return { type: "FeatureCollection", features };
}

// Rail lines drawn for the railroads currently shown. Hiding a railroad in the
// list removes its strands; shared track redraws with the railroads that
// remain, side by side. Railroads drawn but not tracked live (MARC, VRE, ...)
// always show.
function networkShown(net) {
  return !(AGENCIES[net] && state.hidden.has(net));
}

function railCollection() {
  const src = state.railGeo;
  if (!src) return { type: "FeatureCollection", features: [] };
  const features = [];
  for (const f of src.features) {
    const p = f.properties;
    const nets = [p.a, p.b, p.c].filter((n) => n && networkShown(n));
    if (!nets.length) continue;
    const props = { n: nets.length, a: nets[0], b: nets[1], c: nets[2], g: nets[0] };
    if (p.h) props.h = 1;
    features.push({ type: "Feature", geometry: f.geometry, properties: props });
  }
  return { type: "FeatureCollection", features };
}

function redrawRail() {
  setFaded("rail", railCollection());
  redrawDisruptions();
  applyFocus();
}
// Only the disruptions' own small source: redrawing the rail source would
// re-send every track to the map (and, during startup, hold up its load).
function redrawDisruptions() {
  map.getSource("disruptions")?.setData({ type: "FeatureCollection", features: disruptionFeatures() });
}

// ---------- Disruptions ----------
// Stretches where a railroad says no trains are running right now
// (js/disruptions.js), traced along its track: between the two stations its
// notice names, else the two furthest apart of the stations it lists, else
// (a whole MBTA line) the line's two ends. Then trimmed to the stations that
// only the lines it's about serve, so track other trains still run on isn't
// marked: "between Bridgeport and Waterbury" starts at Derby-Shelton, the
// first station on the Waterbury Branch alone. Refreshed every five minutes.
let disruptions = [];      // from loadDisruptions()
let disruptionGeo = null;  // their features, traced once the track and stations are in
async function refreshDisruptions() {
  disruptions = await loadDisruptions().catch(() => disruptions);
  disruptionGeo = null;
  redrawDisruptions();
  if (state.station) renderDetail(); // its "No trains here" note
}
setInterval(() => !document.hidden && refreshDisruptions(), 5 * 60 * 1000);

function disruptionEnds(d) {
  const named = (name) => {
    for (const n of [name, name.split("/")[0]]) {
      const p = state.stopByName.get(`${d.agency}:${norm(n)}`);
      if (p) return p;
    }
    return null;
  };
  const between = d.between?.map(named);
  if (between?.[0] && between[1]) return between;
  let pts = d.stops.map((id) => state.stopPos.get(stopKey(d.agency, id))).filter(Boolean);
  if (pts.length < 2 && d.line) {
    pts = [...state.stations.values()].flatMap((st) => st.members)
      .filter((m) => m.agency === d.agency && (m.lines || []).some((l) => l.startsWith(d.line)));
  }
  let best = null;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const m = meters(pts[i], pts[j]);
      if (!best || m > best[2]) best = [pts[i], pts[j], m];
    }
  }
  return best && best[2] > 300 ? [best[0], best[1]] : null;
}

const unservedAt = new Map(); // station id -> disruptions that leave it with no trains of their railroad
function disruptionFeatures() {
  if (!state.rail || !state.stations.size) return [];
  if (!disruptionGeo) unservedAt.clear();
  disruptionGeo ??= disruptions.flatMap((d) => {
    const ends = disruptionEnds(d);
    if (!ends) return [];
    const [p, q] = ends;
    const path = state.rail.route(state.rail.snap([p.lon, p.lat], 1500, d.agency), state.rail.snap([q.lon, q.lat], 1500, d.agency), d.agency);
    // A route far longer than the gap went some other way: better not drawn.
    if (!path || path.coords.length < 2 || path.length > meters(p, q) * 2.5 + 5000) return [];
    const coords = d.routes.length ? ownStretch(d, path) : path.coords;
    if (coords) markUnserved(d, coords, ends);
    return coords ? [{ type: "Feature", geometry: { type: "LineString", coordinates: coords }, properties: { id: d.id, agency: d.agency, color: AGENCIES[d.agency].color, label: T(d.buses ? "Buses replace trains" : "No trains") } }] : [];
  });
  return disruptionGeo.filter((f) => agencyShown(f.properties.agency));
}

// The stations along a disruption's stretch that no train of its railroad
// reaches right now: all of them, except an end the notice names that the
// line carries on past, with another of its stops just beyond, off the
// stretch. "Buses replace trains between Southeast and Wassaic": trains
// still come up to Southeast from the south; every stop from Patterson to
// Wassaic has none. A stretch trimmed to the stations only its lines serve
// ("between Bridgeport and Waterbury" starts at Derby-Shelton) has none at
// either end.
function markUnserved(d, coords, ends) {
  const lons = coords.map((c) => c[0]), lats = coords.map((c) => c[1]);
  const box = { w: Math.min(...lons) - 0.02, e: Math.max(...lons) + 0.02, s: Math.min(...lats) - 0.02, n: Math.max(...lats) + 0.02 };
  const kx = Math.cos((lats[0] * Math.PI) / 180);
  const gap = (c, m) => Math.hypot((c[0] - m.lon) * kx, c[1] - m.lat) * 111320;
  const on = [];
  for (const st of state.stations.values()) {
    const m = st.members.find((x) => x.agency === d.agency);
    if (!m || m.lon < box.w || m.lon > box.e || m.lat < box.s || m.lat > box.n) continue;
    if (coords.some((c) => gap(c, m) < 400)) on.push({ st, m });
  }
  const ids = new Set(on.map((x) => x.st.id));
  const onItsLine = (x) => x.agency === d.agency && (!d.routes.length || (x.lines || []).some((l) => aboutLine(d, l)));
  for (const { st, m } of on) {
    const atEnd = gap(coords[0], m) < 600 || gap(coords[coords.length - 1], m) < 600;
    if (atEnd && ends.some((e) => meters(e, m) < 600)) {
      const beyond = [...state.stations.values()].some((o) => !ids.has(o.id) && o.members.some((x) => onItsLine(x) && meters(x, m) < 15000));
      if (beyond) continue;
    }
    if (!unservedAt.has(st.id)) unservedAt.set(st.id, []);
    unservedAt.get(st.id).push(d);
  }
}
// The disruptions leaving a station with no trains of a railroad shown.
function unservedHere(st) {
  disruptionFeatures(); // traced, and the stations marked, if they weren't yet
  return (unservedAt.get(st.id) || []).filter((d) => agencyShown(d.agency));
}

// The part of a disruption's path between the first and last stations along
// it served only by the lines it's about; none such, nothing drawn.
function ownStretch(d, path) {
  const kx = Math.cos((path.coords[0][1] * Math.PI) / 180);
  const along = [];
  for (const st of state.stations.values()) {
    const m = st.members.find((x) => x.agency === d.agency);
    if (!m?.lines?.length) continue;
    let best = Infinity, at = 0;
    path.coords.forEach((c, i) => {
      const dd = Math.hypot((c[0] - m.lon) * kx, c[1] - m.lat) * 111320;
      if (dd < best) { best = dd; at = path.cum[i]; }
    });
    if (best < 400) along.push({ at, own: m.lines.every((l) => aboutLine(d, l)) });
  }
  const own = along.filter((x) => x.own).sort((a, b) => a.at - b.at);
  if (!own.length) return null;
  const from = own[0].at, to = own[own.length - 1].at;
  if (to - from < 300) return null;
  const out = [path.at(from).point];
  path.coords.forEach((c, i) => { if (path.cum[i] > from && path.cum[i] < to) out.push(c); });
  out.push(path.at(to).point);
  return out;
}

const BUS_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="3.5" width="15" height="14" rx="3"/><path d="M4.5 10.5h15M8 20.5v-3M16 20.5v-3"/><circle cx="8.5" cy="14" r="0.9" fill="currentColor"/><circle cx="15.5" cy="14" r="0.9" fill="currentColor"/></svg>';
const NO_SERVICE_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/></svg>';

// A disruption's card, on hover or tap: its railroad and its notice.
function disruptionCard(id) {
  const d = disruptions.find((x) => x.id === id);
  if (!d) return "";
  const a = AGENCIES[d.agency];
  return `<div class="rail-net"><span class="dot" style="background:${a.color}"></span>${esc(a.name)} · ${esc(T(d.buses ? "Buses replace trains" : "No trains"))}</div>
    <div class="disruption-note">${esc(d.header)}</div>`;
}

function redrawStations() {
  setFaded("stations", stationCollection());
  map.getSource("footprints")?.setData(footprintCollection());
}

// Where to draw a train: on the nearest track. Falls back to exactly what the
// feed reported (e.g., trains beyond the rail data).
function targetOf(t) {
  return state.est.get(t.id) || t;
}

// Snapping depends only on the reported position, so cache it per train.
const snapCache = new Map(); // id -> { lat, lon, result }
function snapped(t) {
  const towards = state.inferHeading && t.bearing == null ? headingTarget(t) : null;
  const c = snapCache.get(t.id);
  if (c && c.lat === t.lat && c.lon === t.lon && c.towards?.lat === towards?.lat && c.towards?.lon === towards?.lon) return c.result;
  const result = snapToTrack(t, state.rail, towards);
  snapCache.set(t.id, { lat: t.lat, lon: t.lon, towards, result });
  return result;
}

// Where a train is headed next, for pointing it when its feed gives no
// heading: its next stop, or the one after if it's standing at the next.
// Feeds that only name the next stop and the destination (the MBTA's): that
// stop, or the destination once the train is standing at it.
function headingTarget(t) {
  for (const s of t.stops || []) {
    if (s.status === "past") continue;
    const p = state.stopPos.get(s.key);
    if (p && meters(p, t) > 400) return p;
  }
  if (t.stops?.length) return null;
  for (const name of [t.nextStop, t.destination]) {
    const p = name && state.stopByName.get(`${t.agency}:${norm(name)}`);
    if (p && meters(p, t) > 400) return p;
  }
  return null;
}

function computePositions() {
  state.est.clear();
  for (const t of state.trains.values()) {
    const p = snapped(t);
    if (p) state.est.set(t.id, p);
  }
  for (const id of snapCache.keys()) if (!state.trains.has(id)) snapCache.delete(id);
}

// The track: North America's (data/rail.geojson) and each region's abroad
// (js/railregions.js), each joining the drawn rail and the index the first
// time the map shows it, so a view of Europe neither fetches North America's
// nor waits for it. Until a file is in, trains there stay at their reported
// positions. North America's is also loaded when something off the map needs
// it (needTrack: a ride followed there, History's distances).
const NA_TRACK = { region: "na", file: "data/rail.geojson", bbox: [-150.2, 25.7, -63.2, 65] }; // index.html's preload has the same extent
let trackWatch = null;   // watchRegions()'s handle
let naTrackIn = false;   // North America's track is indexed
let railSettled = false; // the opening view's track is in (or none was wanted)
function loadRail() {
  trackWatch = watchRegions(map, [NA_TRACK, ...RAIL_REGIONS], (geojson, r) => {
    // North America's first, as it always was, so it draws below the rest.
    const had = state.railGeo?.features || [];
    state.railGeo = { type: "FeatureCollection", features: r === NA_TRACK ? geojson.features.concat(had) : had.concat(geojson.features) };
    focusCache.key = null; // an open railroad's track may run on into this region
    redrawRail();
    if (state.rail) state.rail.add(geojson);
    else state.rail = new RailIndex(geojson);
    resnap();
    if (r === NA_TRACK) {
      naTrackIn = true;
      if (state.tab === "history") renderAgencies(); // its distances, along the track now
    }
  }, (p, r) => (r === NA_TRACK ? p : arrival(p))); // the fades wait for track abroad only, as before
  trackWatch.first.then(() => (railSettled = true));
}
// Whether a railroad's track can be used; North America's is asked for if it isn't in yet.
const inNA = (agency) => !DATA_REGIONS.some((r) => r.agencies.includes(agency));
function needTrack(agency) {
  if (naTrackIn || !inNA(agency)) return true;
  trackWatch?.load(NA_TRACK);
  return false;
}

// The track just indexed (or grown): everything placed on it goes back on.
function resnap() {
  disruptionGeo = null;
  redrawDisruptions(); // traced along the track, now it's indexed
  snapCache.clear();
  snapStations();
  computePositions();
  animateTo();
  applyFocus(); // a line's track is traced along the rails
}

// Stations and timetables outside the US and Canada (js/regiondata.js): a
// region's join the station list, "Later today", first trains and line
// colors the first time the map shows it, or a search, a link or a page
// needs them. With no such railroads, the module isn't loaded at all.
let regionData = null;
function dataRegions() {
  if (!DATA_REGIONS.length) return null;
  return (regionData ??= import("./regiondata.js?v=dev").then((m) => {
    m.watchData(map, addRegion, arrival);
    return m;
  }).catch((err) => {
    console.warn("data regions", err);
    regionData = null;
  }));
}
// A railroad's region loaded (a promise of it), or null for one in the US or Canada.
const needData = (agency) => (DATA_REGIONS.some((r) => r.agencies.includes(agency)) ? dataRegions().then((m) => m?.loadFor(agency)) : null);
// fn() once a railroad's data is in: at once for one in the US or Canada.
const withData = (agency, fn) => (needData(agency)?.then(fn) ?? fn());
let stationsLoaded;
const stationsReady = new Promise((done) => (stationsLoaded = done));
// The railroads whose region's stations and timetables have loaded, which
// renderCredits() names whether or not their feed answers.
const regionAgencies = new Set();
function addRegion({ region, stations, departures: runs, firsts: first, linecolors }) {
  for (const id of region.agencies) regionAgencies.add(id);
  if (runs) departuresData = { ...departuresData, ...decodeDepartures(runs) };
  // Each railroad's first trains count from its own file's start.
  if (first) firstsData = { ...firstsData, ...Object.fromEntries(Object.entries(first).filter(([k]) => k !== "start").map(([k, v]) => [k, { ...v, start: first.start }])) };
  if (linecolors) lineColorsData = { ...lineColorsData, ...linecolors };
  return stationsReady.then(() => {
    const added = mergeStations(stations, { region: true });
    state.stations = new Map([...state.stations, ...added]);
    lineSizes = null;
    for (const st of added.values()) {
      for (const k of st.keys) state.stationOfKey.set(k, st.id);
      for (const m of st.members) {
        state.stopPos.set(m.key, { lat: m.lat, lon: m.lon });
        state.stopByName.set(`${m.agency}:${m.norm}`, { lat: m.lat, lon: m.lon });
        lineCounts.delete(m.agency);
      }
    }
    snapStations();
    applyInference();
    computePositions();
    renderAll();
  });
}

// Slides markers from where they're drawn to where they should be.
let anim = null;
// Approximate on-screen distance in pixels between two positions at the
// current zoom (Web Mercator: 512 px per world at zoom 0).
function pixelGap(a, b) {
  const scale = (512 * 2 ** map.getZoom()) / 360;
  const k = 1 / Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot((b.lon - a.lon) * scale, (b.lat - a.lat) * scale * k);
}

// Longer slides follow the track between the old and new spot, so a train
// never cuts across a curve. Short hops just slide straight.
function glidePath(t, from, to) {
  if (!state.rail || !t) return null;
  const straight = meters(from, to);
  if (straight < 150) return null;
  const a = state.rail.snap([from.lon, from.lat], 60, t.agency);
  const b = state.rail.snap([to.lon, to.lat], 60, t.agency);
  const path = state.rail.route(a, b, t.agency);
  return path && path.length < straight * 2.5 + 300 ? path : null;
}

function animateTo(duration = ANIM_MS) {
  cancelAnimationFrame(anim);
  redrawRoute();
  const targets = new Map();
  for (const t of state.trains.values()) targets.set(t.id, targetOf(t));
  for (const id of [...state.display.keys()]) if (!targets.has(id)) state.display.delete(id);

  // Only animate trains that are on screen and would visibly move; everything
  // else jumps straight to its new spot in the same single redraw.
  const view = map.getBounds();
  const pad = 0.2 * Math.max(view.getNorth() - view.getSouth(), view.getEast() - view.getWest());
  const inView = (p) => p.lat > view.getSouth() - pad && p.lat < view.getNorth() + pad &&
    p.lon > view.getWest() - pad && p.lon < view.getEast() + pad;
  const still = document.hidden || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const movers = [];
  for (const [id, p] of targets) {
    const f = state.display.get(id);
    if (still || !f || Math.abs(f.lat - p.lat) + Math.abs(f.lon - p.lon) > 1 ||
        !(inView(f) || inView(p)) || pixelGap(f, p) < 1) {
      state.display.set(id, { lat: p.lat, lon: p.lon });
    } else {
      movers.push([id, f, p, glidePath(state.trains.get(id), f, p)]);
    }
  }
  redraw();
  if (!movers.length) return;

  // Rebuilding the marker layer is the expensive part, so cap it at ~30 fps.
  const frameMs = 33;
  const start = performance.now();
  let last = 0;
  const step = (now) => {
    const k = Math.min(1, (now - start) / duration);
    if (now - last >= frameMs || k === 1) {
      last = now;
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      for (const [id, f, p, path] of movers) {
        if (path) {
          const [lon, lat] = path.at(path.length * e).point;
          state.display.set(id, { lat, lon });
        } else {
          state.display.set(id, { lat: f.lat + (p.lat - f.lat) * e, lon: f.lon + (p.lon - f.lon) * e });
        }
      }
      redraw();
    }
    if (k < 1) anim = requestAnimationFrame(step);
  };
  anim = requestAnimationFrame(step);
}

function mergeTrains() {
  state.trains = new Map();
  for (const list of Object.values(state.bySource)) for (const t of list) state.trains.set(t.id, t);
  applyMtaConsists();
  applyInference();
  applyDetails();
  computePositions();
  animateTo();
  checkTracked();
  trackPlanned();
  checkRiding();
  renderAll();
  if (state.follow && state.selected) {
    const t = state.trains.get(state.selected);
    if (t) map.easeTo({ center: [targetOf(t).lon, targetOf(t).lat], duration: ANIM_MS });
  }
}

// The LIRR's and Metro-North's real trains, car by car (TrainTime's data,
// through the relay, read every minute), drawn in place of the typical ones.
let mtaConsists = new Map(); // "lirr:1068" -> { numbers, types }
const MTA_MODELS = { M7: "m7", M9: "m9", M3: "m3", M3A: "m3", M7A: "m7a", M8: "m8", C3: "c3", SL: "shoreliner", SC: "charger", P32: "p32" };
function loadMtaConsists() {
  if (!RELAY || !(agencyShown("lirr") || agencyShown("mnr"))) return;
  fetch(`${RELAY.replace(/\/$/, "")}/mta-consists`).then((r) => (r.ok ? r.json() : null)).then((d) => {
    if (!d?.trains) return;
    mtaConsists = new Map(Object.entries(d.trains).map(([k, cars]) => {
      const types = cars.map(([, type]) => MTA_MODELS[type] || null);
      // A Shoreliner set's cab car: the end opposite its locomotive.
      if (types.includes("shoreliner")) {
        if (cars[0][2] && types[types.length - 1] === "shoreliner") types[types.length - 1] = "shorelinerCab";
        else if (cars[cars.length - 1][2] && types[0] === "shoreliner") types[0] = "shorelinerCab";
      }
      return [k.replace(/^LIRR:/, "lirr:").replace(/^MNR:/, "mnr:"), { numbers: cars.map(([no]) => no), types }];
    }));
    if (applyMtaConsists()) renderAll();
  }).catch(() => {});
}
function applyMtaConsists() {
  let changed = false;
  for (const t of state.trains.values()) {
    if (t.agency !== "lirr" && t.agency !== "mnr") continue;
    const c = mtaConsists.get(`${t.agency}:${t.number}`);
    if (c && t.cars?.numbers?.join() !== c.numbers.join()) {
      t.cars = { numbers: c.numbers, types: c.types, complete: true };
      changed = true;
    }
  }
  return changed;
}
setInterval(() => !document.hidden && loadMtaConsists(), 60 * 1000);
setTimeout(loadMtaConsists, 3000);

// Delays the GPS proves but the railroad hasn't posted yet.
function applyInference() {
  for (const t of state.trains.values()) state.inferDelays ? inferDelay(t, state.stopPos) : restoreFeed(t);
}

// ---------- One train's details, on request ----------
// A railroad whose plug-in names a detail source (AGENCIES[a].detail, e.g.
// ViaggiaTreno for Trenitalia's) has each train asked for through the relay
// on its own, only while a viewer has it open or tracks it: once when it's
// opened or tracked, then every two minutes while it stays so (and not in a
// background tab, after the first). Nothing is asked for a train nobody
// opens. The answer (delay, last report, platforms, stop times) is merged
// into the train at every refresh of its feed (sources.js applyDetail), and
// kept ten minutes after the train is closed; a train placed from its
// timetable is placed from the delayed times, and stays on the map while
// it runs late past its timetabled arrival.
const DETAIL_MS = 2 * 60 * 1000, DETAIL_KEEP_MS = 10 * 60 * 1000;
const details = new Map(); // train id -> { tried, at, data, train, busy }
function refreshDetails() {
  if (!RELAY || !details.size && !state.selected && !state.tracked.length) return;
  const wanted = new Set([state.selected, ...state.tracked.map((r) => r.id)].filter(Boolean));
  for (const id of wanted) {
    const t = state.trains.get(id) || details.get(id)?.train;
    const src = t && AGENCIES[t.agency]?.detail;
    if (!src || !state.relayFeeds?.[src]) continue;
    const d = details.get(id) || {};
    if (d.busy || Date.now() - (d.tried || 0) < DETAIL_MS || (document.hidden && d.at)) continue;
    const url = detailUrl(t, RELAY);
    if (!url) continue;
    Object.assign(d, { busy: true, tried: Date.now(), train: d.train || t });
    details.set(id, d);
    fetchDetail(url)
      .then((data) => {
        Object.assign(d, { data, at: Date.now() });
        mergeTrains();
      })
      .catch((err) => console.warn(`[${src}]`, err.message))
      .finally(() => (d.busy = false));
  }
  for (const [id, d] of details) if (!wanted.has(id) && Date.now() - (d.at || d.tried) > DETAIL_KEEP_MS) details.delete(id);
}
setInterval(refreshDetails, 15 * 1000);
function applyDetails() {
  for (const [id, d] of details) {
    if (!d.data?.found || Date.now() - d.at > DETAIL_KEEP_MS) continue;
    const t = state.trains.get(id);
    if (t) {
      applyDetail(t, d.data);
      d.train = t;
    } else if (d.train && !d.data.arrived && !d.data.cancelled && applyDetail(d.train, d.data)) {
      state.trains.set(id, d.train); // running late past its timetable
    }
  }
}

// ---------- Feeds ----------

// Whether a source's trains can be shown ({ ok }), and if not, why. A
// source whose feed waits on a key (untilKey "timetable") shows its
// railroads' trains from their timetables meanwhile ({ ok, timetable,
// reason }): with no relay, a relay that can't be reached, or one that
// reports its feed off. Once the relay has the key, the feed is read.
function sourceAvailability(src) {
  if (!src.relay || (window.TRAINSHEET_FEEDS || {})[src.id]) return { ok: true };
  const off = !RELAY ? T("Needs the relay (see README)")
    : state.relayFeeds && !state.relayFeeds[src.id] ? (src.needsKey ? T("Needs a free API key") : T("Not enabled on relay"))
    : null;
  // A feed waiting on its key isn't asked for before the relay says it has
  // the key: until then its trains come from the timetable too.
  if (!off && !(src.untilKey === "timetable" && !state.relayFeeds)) return { ok: true };
  if (src.untilKey === "timetable") return { ok: true, timetable: true, reason: T("Placed from the timetable until its API key is set") };
  return { ok: false, reason: off };
}
// A source's trains, from its feed or (waiting on its key) its timetables.
const fetchTrains = (src) => fetchSource(src, RELAY, Boolean(sourceAvailability(src).timetable));

// A plug-in source scoped to the view (scope "view") is polled only while
// one of its railroads is wanted: its stations' area (padded by a quarter)
// meets the map, or one of its trains is open or tracked, its page is open,
// or "Near you" is looking where it runs. Every other source always is.
const viewScoped = (src) => src.scope === "view";
function meetsView(bbox, bounds) {
  if (!bbox) return true; // nowhere to place it: as if always
  const [w, s, e, n] = bbox, px = (e - w) / 4, py = (n - s) / 4;
  // The map's longitudes aren't wrapped to ±180 once it is dragged across the antimeridian.
  return s - py <= bounds.getNorth() && n + py >= bounds.getSouth() &&
    [-360, 0, 360].some((k) => w - px + k <= bounds.getEast() && e + px + k >= bounds.getWest());
}
function sourceWanted(src) {
  if (!viewScoped(src)) return true;
  const bounds = map.getBounds();
  const ours = (agency) => src.agencies.includes(agency);
  return src.agencies.some((id) => meetsView(AGENCIES[id].bbox, bounds)) ||
    ours(state.trains.get(state.selected)?.agency) || ours(state.railroad) || state.tracked.some((r) => ours(r.agency)) ||
    Boolean(nearFix && src.agencies.some((id) => {
      const b = AGENCIES[id].bbox;
      return !b || (nearFix.lon >= b[0] - 1.5 && nearFix.lon <= b[2] + 1.5 && nearFix.lat >= b[1] - 1.5 && nearFix.lat <= b[3] + 1.5); // about NEAR_MAX_M
    }));
}
const pollTimers = {}; // source id -> its next poll
const polling = new Set(); // sources being fetched right now
const backoff = {}; // source id -> when a failed source may be tried again
// A view-scoped source that has just become wanted (the map moved onto it, a
// train of it was opened) is polled at once, unless it was a moment ago;
// with `all`, every one is fetched once whether wanted or not (a search, or
// a shared link to a train, may be for any railroad).
function wakeSources(all = false) {
  for (const src of SOURCES) {
    if (!viewScoped(src) || polling.has(src.id) || Date.now() < (backoff[src.id] || 0) || !sourceAvailability(src).ok || !(all || sourceWanted(src))) continue;
    const at = state.sourceStatus[src.id]?.at;
    if (!at || Date.now() - at > src.interval * 1000) poll(src, 0, all);
  }
}

async function poll(src, attempt = 0, once = false) {
  clearTimeout(pollTimers[src.id]);
  let delay = src.interval;
  // Background tabs skip refreshes, but always load once.
  if ((once || sourceWanted(src)) && (!document.hidden || !state.sourceStatus[src.id]?.at)) {
    polling.add(src.id);
    try {
      // A railroad's first trains are waited for by the fades (see arrival()).
      const fetching = fetchTrains(src);
      state.bySource[src.id] = await (state.sourceStatus[src.id]?.at ? fetching : arrival(fetching));
      state.sourceStatus[src.id] = { status: "ok", at: Date.now() };
      attempt = 0;
    } catch (err) {
      console.warn(`[${src.id}]`, err);
      const prev = state.sourceStatus[src.id];
      state.sourceStatus[src.id] = { status: "error", error: err.message, at: prev?.at };
      // Keep showing the last good positions for a few minutes.
      if (!prev?.at || Date.now() - prev.at > 5 * 60 * 1000) state.bySource[src.id] = [];
      attempt++;
      delay = Math.min(300, src.interval * 2 ** attempt);
      // Rate limited (the MBTA without a key): its window is a minute.
      if (/HTTP 429/.test(err.message)) delay = Math.max(delay, 60);
    }
    backoff[src.id] = attempt ? Date.now() + delay * 1000 : 0;
    polling.delete(src.id);
    mergeTrains();
  } else if (state.sourceStatus[src.id]?.status === "loading") {
    state.sourceStatus[src.id] = { status: "idle" }; // not on screen: not fetched yet
  } else if (!once && !sourceWanted(src) && state.bySource[src.id]?.length && Date.now() - (state.sourceStatus[src.id]?.at || 0) > 5 * 60 * 1000) {
    // Off screen a while: its last trains are too old to show or count.
    state.bySource[src.id] = [];
    state.sourceStatus[src.id] = { status: "idle" };
    mergeTrains();
  }
  pollTimers[src.id] = setTimeout(() => poll(src, attempt), delay * 1000);
}

async function start() {
  loadRail();
  dataRegions();
  for (const r of state.tracked) needData(r.agency), needTrack(r.agency); // a ride followed elsewhere
  loadStations()
    .then((stations) => {
      state.stations = stations;
      // Each stop key (as trains list them) to its station on the map.
      state.stationOfKey = new Map([...stations.values()].flatMap((st) => [...st.keys].map((k) => [k, st.id])));
      // Optional: outlines for major terminals (scripts/build_footprints.py).
      fetch("data/footprints.json?v=dev")
        .then((r) => (r.ok ? r.json() : {}))
        .then((outlines) => {
          for (const st of stations.values()) st.footprint = st.members.map((m) => outlines[m.key]).find(Boolean) || null;
          redrawStations();
        })
        .catch(() => {});
      for (const st of stations.values()) {
        for (const m of st.members) {
          state.stopPos.set(m.key, { lat: m.lat, lon: m.lon });
          state.stopByName.set(`${m.agency}:${m.norm}`, { lat: m.lat, lon: m.lon });
        }
      }
      snapStations();
      applyInference();
      computePositions();
      redrawStations();
      refreshDisruptions();
      stationsLoaded();
      if (wantedStation) selectStation(wantedStation); // abroad, once its region is in
      else if (AGENCIES[wantedRailroad]) {
        // Framed once the map is ready (a shared link may open before it is),
        // and a railroad abroad once its stations are in.
        openRailroad(wantedRailroad, { fly: false, line: new URL(location.href).searchParams.get("line") });
        const frame = () => frameFocus();
        withData(wantedRailroad, () => (mapLoaded ? frame() : map.once("load", frame)));
      }
      renderResults();
    })
    .catch((err) => console.warn("stations", err));
  // Feeds read directly (Amtrak, VIA and Brightline among them) start at
  // once; the relay's wait for its list of what it serves. Until then its
  // railroads shimmer in the list as loading.
  const direct = (src) => !src.relay || (window.TRAINSHEET_FEEDS || {})[src.id];
  const startPolls = (which) => {
    for (const src of SOURCES) {
      if (which(src) && sourceAvailability(src).ok) {
        state.sourceStatus[src.id] = { status: "loading" };
        poll(src);
      }
    }
  };
  startPolls(direct);
  if (RELAY) {
    for (const src of SOURCES) if (!direct(src)) state.sourceStatus[src.id] = { status: "loading" };
    renderAll();
    try {
      // Fresh every load, so a railroad just switched on in the relay shows at once.
      const res = await fetch(`${RELAY.replace(/\/$/, "")}/status`, { cache: "no-cache" });
      state.relayFeeds = (await res.json()).feeds;
      redrawStations();
    } catch {
      state.relayFeeds = {};
      toast(T("Couldn't reach the relay — showing directly available railroads only."));
    }
    for (const src of SOURCES) if (!direct(src) && !sourceAvailability(src).ok) delete state.sourceStatus[src.id];
    startPolls((src) => !direct(src));
    refreshDetails(); // a train opened from a link before the relay answered
  } else {
    // No relay: the railroads whose feeds wait on a key, from their timetables.
    startPolls((src) => !direct(src));
  }
  // A shared link to a train: its railroad may be anywhere.
  if (wanted) wakeSources(true);
  renderAll();
}
map.on("moveend", () => wakeSources());

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    // Refresh soon after returning to the tab; regular polling resumes itself.
    for (const src of SOURCES) if (sourceAvailability(src).ok && sourceWanted(src)) fetchTrains(src).then((l) => {
      state.bySource[src.id] = l;
      state.sourceStatus[src.id] = { status: "ok", at: Date.now() };
      mergeTrains();
    }).catch(() => {});
  }
});

// Trains placed from the timetable (Metro-North) advance between refreshes.
let lastTimetable = 0;
function tick() {
  setTimeout(tick, 2000);
  if (document.hidden || map.isMoving()) return;
  const now = Date.now();
  if (now - lastTimetable < 6000) return;
  lastTimetable = now;
  let moved = false;
  for (const t of state.trains.values()) moved = advanceEstimated(t) || moved;
  if (moved) {
    computePositions(); // re-snap the timetable-placed trains that moved
    animateTo();
  }
}
setTimeout(tick, 2000);
// The selected train's panel (its last GPS report, "3 min ago") ages too.
setInterval(() => !document.hidden && state.selected && renderDetail(), 10000);



// ---------- Rendering: only what changed ----------
// The panes are drawn as HTML strings, and every feed refresh draws them all
// again (renderAll), though most of the time nothing in them has changed:
// the home list says the same, and the open page differs in one time at
// most. So a pane's HTML is set only when it isn't what the pane already
// shows; and a page is built as a list of top-level pieces (the hero with
// the cars' drawing, the live card, the stops...), each one element or
// nothing, of which only the pieces whose HTML changed are put in again.
// The drawings stay as they are, the strips and lists keep their scroll,
// and the browser has far less to rebuild.
const paneHtml = new WeakMap(); // element -> the HTML it was last given
function setPane(el, html) {
  if (paneHtml.get(el) === html) return;
  paneHtml.set(el, html);
  el.innerHTML = html;
}
const pageParts = new WeakMap(); // element -> { key, parts, nodes }: the page it shows, piece by piece
const elementOf = (html) => {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  return tpl.content.firstElementChild;
};
// A page newly opened comes in with a short rise and fade, as a pushed view
// does (design.css); the same page drawn again doesn't.
const pageKeys = new WeakMap(); // element -> the page it shows
function pageIn(el) {
  el.classList.remove("page-in");
  void el.offsetWidth;
  el.classList.add("page-in");
}
function renderParts(el, key, parts) {
  if (pageKeys.get(el) !== key) {
    pageKeys.set(el, key);
    pageIn(el);
  }
  const prev = pageParts.get(el);
  // The same page as before, its pieces still where they were put: swap
  // just the ones that changed. Anything else (another page, or something
  // drawn over this one since) starts over.
  if (prev?.key === key && el.children.length === prev.nodes.filter(Boolean).length && prev.nodes.every((n) => !n || n.parentNode === el)) {
    const nodes = prev.nodes.slice();
    parts.forEach((html, i) => {
      if (html === prev.parts[i]) return;
      const node = html ? elementOf(html) : null;
      if (nodes[i] && node) nodes[i].replaceWith(node);
      else if (nodes[i]) nodes[i].remove();
      else if (node) el.insertBefore(node, nodes.slice(i + 1).find(Boolean) || null);
      nodes[i] = node;
    });
    pageParts.set(el, { key, parts, nodes });
    return;
  }
  el.innerHTML = `\n    ${parts.join("\n    ")}`;
  let k = 0;
  const nodes = parts.map((html) => (html ? el.children[k++] : null));
  // (A piece that isn't one element can't be told from its neighbors: then
  // the page is drawn whole again next time, as before.)
  pageParts.set(el, k === el.children.length && nodes.every((n, i) => Boolean(n) === Boolean(parts[i])) ? { key, parts, nodes } : null);
}

// ---------- Rendering: list ----------

const CHECK = '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path fill="#fff" d="m9.5 16.2-4.2-4.2-1.4 1.4 5.6 5.6 11-11-1.4-1.4z"/></svg>';

function agencyCounts() {
  const counts = {};
  for (const t of state.trains.values()) counts[t.agency] = (counts[t.agency] || 0) + 1;
  return counts;
}

// A country's name in the reader's language ("US" -> "United States").
let countryNames = null;
function countryName(code) {
  try {
    countryNames ??= new Intl.DisplayNames([lang], { type: "region" });
    return countryNames.of(code) || code;
  } catch {
    return code;
  }
}

// The home list, all about the reader: signed in, their next trip, the
// ones planned after it, and what they've ridden; signed out, a card to sign
// in. Then the trains near them, and every railroad. "All railroads" opens
// them in one list, by country (alphabetical, as are the railroads in each).
let openCountry = null; // "*" while the list shows every railroad, else null (home)

// A railroad's region where it says more than its country ("New York", not
// "United States").
const regionOf = (a) => (a.region && T(a.region) !== countryName(a.country) ? T(a.region) : "");

function agencyRows() {
  const counts = agencyCounts();
  const countries = new Map(); // country code -> { rows: [{ name, html }], agencies, running, idle, off }
  const of = (c) => {
    if (!countries.has(c)) countries.set(c, { rows: [], agencies: [], running: 0, idle: true, off: false });
    return countries.get(c);
  };
  for (const src of SOURCES) {
    const avail = sourceAvailability(src);
    const st = state.sourceStatus[src.id];
    for (const id of src.agencies) {
      const a = AGENCIES[id], g = of(a.country);
      // A railroad waiting on its key says its trains are the timetable's.
      const region = [regionOf(a), avail.timetable ? T("timetable") : ""].filter(Boolean).join(" · ");
      g.agencies.push(id);
      const name = `<span class="name"${avail.timetable ? ` title="${esc(avail.reason)}"` : ""}>${esc(a.name)}${region ? ` <span class="rgn">${esc(region)}</span>` : ""}</span>`;
      if (!avail.ok) {
        g.off = true;
        g.rows.push({ name: a.name, html: `
          <div class="agency compact unavailable" style="--swatch:${a.color}" title="${esc(avail.reason)}">
            <span class="check-hit"><span class="check"></span></span>
            <span class="agency-open">${name}<span class="count">${esc(T("Not connected"))}</span></span>
          </div>` });
        continue;
      }
      g.running += counts[id] || 0;
      if (st?.status !== "idle") g.idle = false;
      // The checkbox shows or hides its trains; the rest of the row opens its page.
      const off = state.hidden.has(id);
      let count = `<span class="count">${counts[id] || 0} ›</span>`;
      if (st?.status === "loading") count = `<span class="count"><span class="sk sk-count" aria-label="${T("Loading")}"></span></span>`;
      else if (st?.status === "error" && !counts[id]) count = `<span class="count err" title="${esc(st.error)}">${T("offline")} ›</span>`;
      // Not fetched yet (its area hasn't been in view): no count.
      else if (st?.status === "idle") count = `<span class="count">›</span>`;
      g.rows.push({ name: a.name, html: `
        <div class="agency compact ${off ? "off" : ""}" style="--swatch:${a.color}">
          <button type="button" class="check-hit" data-toggle="${id}" aria-pressed="${!off}" aria-label="${esc(T(off ? "Show {name} trains" : "Hide {name} trains", { name: a.name }))}" title="${T(off ? "Show its trains" : "Hide its trains")}"><span class="check">${CHECK}</span></button>
          <button type="button" class="agency-open" data-railroad="${id}" aria-label="${esc(T("{name}: its lines and fleet", { name: a.name }))}">
            ${name}${count}
          </button>
        </div>` });
    }
  }
  return countries;
}

const byName = (x, y) => x.localeCompare(y, lang, { sensitivity: "base" });

function renderAgencies() {
  const el = $("agencies");
  if (state.tab === "trips") return setPane(el, myTripsHtml());
  if (state.tab === "history") return setPane(el, historyHtml());
  if (openCountry) return setPane(el, allRailroadsHtml());
  setPane(el, nearbyHtml() + `<div class="group-title">${T("Railroads")}</div>
    <button type="button" class="home-row" data-all-railroads>
      <span class="home-row-icon" aria-hidden="true">${TRAIN_ICON}</span>
      <span class="home-row-text">${T("All railroads")}</span>
      <span class="count">${esc(Tn(Object.keys(AGENCIES).length, "{n} railroad", "{n} railroads"))} ›</span>
    </button>`);
}

function allRailroadsHtml() {
  const countries = agencyRows();
  // The viewer's own country first (from the browser's language, en-US's
  // US), then the rest by name.
  const home = ((navigator.language || "").match(/-([a-z]{2})\b/i)?.[1] || "US").toUpperCase();
  const order = [...countries.keys()].sort((x, y) => (y === home) - (x === home) || byName(countryName(x), countryName(y)));
  const anyOff = order.some((c) => countries.get(c).off);
  return `<button type="button" class="country-back" data-country-back><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="m14.7 5.3 1.4 1.4L10.8 12l5.3 5.3-1.4 1.4L8 12z"/></svg>${T(accountsOn() ? "Browse" : "Home")}</button>` +
    `<div class="group-title country-title">${T("All railroads")}</div>` +
    order.map((c) => {
      const g = countries.get(c);
      const count = g.idle && !g.running ? "" : T("{n} running", { n: g.running });
      return `<button type="button" class="group-title country-head" data-country="${c}" title="${esc(T("Show {country} on the map", { country: countryName(c) }))}">
          <span>${esc(countryName(c))}</span><span>${esc(count)}</span></button>` +
        g.rows.sort((x, y) => byName(x.name, y.name)).map((r) => r.html).join("");
    }).join("") +
    (anyOff ? `<p class="note">${T(RELAY ? "Railroads marked Not connected publish live data, but it has to be fetched through a small relay server or with a free developer key. See the README to switch them on." : "Railroads marked Not connected publish live data, but it has to be fetched through a small relay server. See the README to switch them on.")}</p>` : "");
}

// Frames a country's railroads on the map: its regional track where it has
// some (cut at the border, unlike the railroads' own boxes, which reach as
// far as their trains run abroad), else its railroads' boxes, else their
// stations.
function frameCountry(code) {
  const ids = new Set(Object.keys(AGENCIES).filter((id) => AGENCIES[id].country === code));
  const b = new maplibregl.LngLatBounds();
  const region = RAIL_REGIONS.find((r) => r.region === code.toLowerCase());
  for (const box of region ? [region.bbox] : [...ids].map((id) => AGENCIES[id].bbox).filter(Boolean)) {
    b.extend([box[0], box[1]]);
    b.extend([box[2], box[3]]);
  }
  if (b.isEmpty()) for (const st of state.stations.values()) if (st.agencies.some((a) => ids.has(a))) b.extend([stationPos(st).lon, stationPos(st).lat]);
  if (b.isEmpty()) return;
  const pad = panelPadding();
  map.stop();
  map.fitBounds(b, { padding: { top: Math.max(40, pad.top + 20), right: 40, bottom: Math.max(40, pad.bottom + 20), left: Math.max(40, pad.left + 30) }, maxZoom: 9, duration: 900 });
  if (isPhone) setSheet("");
}

// ---------- Home: your trips ----------

const ACCOUNTS = window.TRAINSHEET_ACCOUNTS || {};
let account = null;        // js/account.js once loaded (Account, below)
let accountLoading = null;

const TRAIN_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><rect x="6" y="3.5" width="12" height="13" rx="3"/><path d="M6 10.5h12M9.5 13.5h.01M14.5 13.5h.01M9 16.5l-2 4M15 16.5l2 4"/></g></svg>';
const signedInHere = () => Boolean(account?.user || (!account && store.get("tt-auth", null)));
const accountsOn = () => Boolean(ACCOUNTS.url && ACCOUNTS.key);
const tripDate = (day, opts = { weekday: "short", month: "short", day: "numeric" }) => {
  const d = new Date(`${day}T12:00:00Z`);
  const year = day.slice(0, 4) !== String(new Date().getFullYear()) ? { year: "numeric" } : {};
  return dateFormat({ ...opts, ...year, timeZone: "UTC" }).format(d);
};
// How far off a trip's day is: "today", "tomorrow", "in 5 days", "in 3 months".
function tripWhen(day) {
  const n = Math.round((Date.parse(`${day}T12:00:00Z`) - Date.parse(`${account.today()}T12:00:00Z`)) / 86400000);
  if (n <= 0) return T("today");
  if (n === 1) return T("tomorrow");
  if (n < 45) return T("in {n} days", { n });
  return Tn(Math.round(n / 30.4), "in 1 month", "in {n} months");
}
const tripTrain = (r) => (r.number ? [...state.trains.values()].find((t) => t.agency === r.agency && String(t.number) === String(r.number)) : null);
const stopTzOf = (key) => {
  const s = key && state.stations.get(state.stationOfKey?.get(key));
  return s ? s.members.find((m) => m.key === key)?.tz || s.tz : null;
};
const stationNameOf = (key) => {
  const s = key && state.stations.get(state.stationOfKey?.get(key));
  return s ? s.members.find((m) => m.key === key)?.name || s.name : null;
};
const tripTime = (iso, key, agency) => (iso ? fmtTime(iso, stopTzOf(key) || AGENCIES[agency]?.tz) : "");
function fmtSpan(ms) {
  const m = Math.round(ms / 60000), h = Math.floor(m / 60);
  return h ? (m % 60 ? `${h} h ${m % 60} min` : `${h} h`) : `${m} min`;
}

// ---------- Pages: My trips, Browse, History ----------
// Three pages, switched by a tab bar at the foot of the sheet on phones and
// an icon rail beside the panel on computers (index.html, design.css). Browse
// is search, trains near you and every railroad, for everyone; My trips and
// History are the rider's trips (js/account.js), and ask them to sign in
// when they haven't. A train's, station's or line's page opens over any of
// them, and Back (or the page's tab again) returns to it.

const PLUS_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
const TICK_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const TICKET_ICON = $("tabbar")?.querySelector('[data-tab="trips"] svg')?.outerHTML || "";
const CAL_ICON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5.5" width="16" height="14" rx="3"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4M12 12.5v5M9.5 15h5"/></g></svg>';
const CHART_ICON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 19.5V13M10 19.5V6.5M15 19.5V10M20 19.5V4.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
const PROVIDER_NAMES = { google: "Google", facebook: "Facebook", apple: "Apple", github: "GitHub", azure: "Microsoft", discord: "Discord" };
const localDay = (ms = Date.now(), tz) => { try { return new Intl.DateTimeFormat("en-CA", { timeZone: tz || undefined }).format(ms); } catch { return new Intl.DateTimeFormat("en-CA").format(ms); } };
const addDaysIso = (day, n) => new Date(Date.parse(`${day}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

// The panel put away: the page you're on chosen again, or a tap on the map
// itself, leaves just the map and the rail (on a computer; on a phone the
// sheet folds down). Any page, train or station opened brings it back.
let panelAway = false;
const isAway = () => (isPhone ? sheetMode() === "collapsed" : panelAway);
function putPanelAway(away = true, { boot = false } = {}) {
  if (!document.body.classList.contains("has-tabs")) return; // no rail to bring it back
  if (isPhone) {
    if (away) setSheet("collapsed");
    else if (sheetMode() === "collapsed") setSheet("");
    return syncMapPadding(!boot);
  }
  if (panelAway === away) return;
  panelAway = away;
  document.body.classList.toggle("panel-away", away);
  $("panel").inert = away;
  if (away) toggleMenu(false);
  syncMapPadding(!boot);
}
// The map's padding (the part of it the panel leaves free, where zooming
// with the buttons centers and pages frame what they show) follows the
// panel as it comes and goes, without moving what's on screen.
// On opening, the padding is set without holding the view: the address's
// map position was saved with it, and holding the view would move the map
// a little further at every visit.
function syncMapPadding(keepView = true) {
  const pad = panelPadding(), cur = map.getPadding();
  if (["top", "bottom", "left", "right"].every((k) => Math.abs((cur[k] || 0) - (pad[k] || 0)) < 1)) return;
  if (!keepView) return map.setPadding(pad);
  if (map.isMoving()) return map.once("moveend", () => syncMapPadding());
  const { clientWidth: w, clientHeight: h } = map.getContainer();
  const center = map.unproject([pad.left + (w - pad.left - pad.right) / 2, pad.top + (h - pad.top - pad.bottom) / 2]);
  map.jumpTo({ center, padding: pad });
}

function setTab(tab) {
  if (!["trips", "browse", "history"].includes(tab)) return;
  const again = state.tab === tab;
  if (again && !isAway()) {
    if (state.selected || state.station || state.railroad) goHome();
    return putPanelAway(true);
  }
  putPanelAway(false);
  if (state.selected || state.station || state.railroad) goHome();
  state.tab = tab;
  $("view-list").dataset.tab = tab;
  for (const b of $("tabbar").querySelectorAll("[data-tab]")) {
    if (b.dataset.tab === tab) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  }
  if (again) return;
  $("agencies").scrollTop = 0;
  renderAgencies();
  renderResults();
  pageIn($("agencies"));
}
on("tabbar", "click", (e) => {
  const b = e.target.closest("[data-tab]");
  if (b) return setTab(b.dataset.tab);
  if (e.target.closest("#rail-settings")) {
    e.stopPropagation();
    toggleMenu();
  }
});

// A page's large title, with its buttons (and, on a phone, Settings).
const pageHead = (title, actions = "") => `<div class="page-head"><h1>${esc(title)}</h1><span class="page-actions">${actions}<button type="button" class="icon-btn page-gear avatar-btn" data-settings aria-label="${esc(T("Account and settings"))}" title="${esc(T("Account and settings"))}">${avatarHtml()}</button></span></div>`;

// My trips and History, signed out: what an account gives, and the ways in.
function signedOutHtml(tab) {
  const providers = (ACCOUNTS.providers || []).filter((p) => PROVIDER_NAMES[p]);
  return `<div class="so">
    <div class="so-hero"><span class="so-icon">${TICKET_ICON}</span>
      <h2>${T("Your trips, on every device")}</h2>
      <p>${T(tab === "history" ? "Keep a log of every ride: how many trips, how long on board, how far, and where." : "Plan the trains you'll take and keep a log of every ride.")}</p></div>
    <div class="so-list">
      <div class="so-row">${CAL_ICON}<span><strong>${T("Plan ahead")}</strong><span>${T("Add trains from Browse in one tap")}</span></span></div>
      <div class="so-row">${BELL_ICON}<span><strong>${T("Tracked on the day")}</strong><span>${T("Live status and track, with nothing to set up")}</span></span></div>
      <div class="so-row">${CHART_ICON}<span><strong>${T("Your history")}</strong><span>${T("Trips, time on board, distance and stations")}</span></span></div>
    </div>
    <div class="so-actions">
      ${providers.map((p) => `<button type="button" class="btn primary so-btn" data-signin-provider="${p}">${esc(T("Continue with {provider}", { provider: PROVIDER_NAMES[p] }))}</button>`).join("")}
      <button type="button" class="btn so-btn${providers.length ? "" : " primary"}" data-signin-email>${T("Continue with email")}</button>
      <button type="button" class="link-btn so-skip" data-tab-go="browse">${T("Browse trains without an account")}</button>
    </div>
  </div>`;
}

// A count of minutes or hours ahead, large: "42 min", "3 h 10 min".
function countdown(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 1) return `<strong>${esc(T("now"))}</strong>`;
  if (m < 60) return `<strong>${m}</strong><small>${T("min")}</small>`;
  const h = Math.floor(m / 60), r = m % 60;
  return `<strong>${h}</strong><small>${T("h")}</small>${r ? `<strong>${r}</strong><small>${T("min")}</small>` : ""}`;
}

// The next trip, large: when it leaves (a countdown on the day), from where
// and on which track, where it gets in, and its train once it's out.
function nextTripCard(legs) {
  const r = legs[0], last = legs[legs.length - 1], now = Date.now();
  // The train being ridden, or the next to be: its live train, once it's out.
  const cur = legs.find((l) => !(Date.parse(l.arrive_at) < now)) || last;
  const a = AGENCIES[r.agency] || { short: r.agency, name: r.agency, color: "#888" };
  const live = cur.service_date === account.today() ? tripTrain(cur) : null;
  const tracked = live && state.tracked.some((x) => x.id === live.id);
  const from = live && cur === r && stopOfTrip(live, r.from_key, r.from_name), to = live && cur === last && stopOfTrip(live, last.to_key, last.to_name);
  const depMs = Date.parse(from?.dep || from?.time || r.depart_at), arrMs = Date.parse(to?.time || last.arrive_at);
  const onWay = from?.status === "past" || (depMs && now >= depMs);
  const when = tripWhen(r.service_date);
  let label, big;
  if (onWay && arrMs > now) {
    label = last.to_name ? T("On its way · gets to {place} in", { place: last.to_name }) : T("On its way · arrives in");
    big = countdown(arrMs - now);
  } else if (depMs && depMs > now && depMs - now < 24 * 3600000) {
    label = `${when[0].toUpperCase()}${when.slice(1)} · ${r.from_name ? T("leaves {place} in", { place: r.from_name }) : T("leaves in")}`;
    big = countdown(depMs - now);
  } else {
    label = r.from_name ? T("Leaves {place}", { place: r.from_name }) : T("Leaves");
    big = `<span class="tk-day">${esc(tripDate(r.service_date, { weekday: "long", month: "long", day: "numeric" }))}</span>`;
  }
  const dep = tripTime(r.depart_at, r.from_key, r.agency), arr = tripTime(last.arrive_at, last.to_key, last.agency);
  const span = r.depart_at && last.arrive_at ? fmtSpan(Date.parse(last.arrive_at) - Date.parse(r.depart_at)) : "";
  const track = from?.track ? T("Track {track}", { track: from.track }) : "";
  const toKey = legs.length === 1 && (r.to_key || (r.to_name && [...(loadDelays(r.agency, r.number)?.stops.keys() || [])].find((k) => stationNameOf(k) && fold(stationNameOf(k)) === fold(r.to_name))));
  const usual = toKey && !live ? usualDelay(r.agency, r.number, toKey) : null;
  const status = live ? statusSpan(live, "status") : usual ? `<span class="nt-usual ${lateText(usual.median).cls}">${esc(lateText(usual.median).cls === "good" ? T("Usually on time") : T("Usually {late}", { late: lateText(usual.median).text.toLowerCase() }))}</span>` : "";
  const train = legs.length > 1
    ? `${legs.map((l) => { const la = AGENCIES[l.agency] || a; return plate(l.number || la.short, la.color, "xs"); }).join('<span class="tk-then" aria-hidden="true">›</span>')}<span>${esc(T("{n} trains", { n: legs.length }))}</span>`
    : `${plate(r.number || a.short, a.color, "xs")}<span>${esc(r.route || a.name)}</span>`;
  return `<div class="trip-card">
    <div class="tk-top"><span class="tk-train">${train}</span>${status}</div>
    <div class="tk-label">${esc(label)}</div>
    <div class="tk-big">${big}</div>
    ${r.from_name || last.to_name ? `<div class="tk-leg">
      <span class="nt-end"><strong>${esc(dep || "—")}</strong><span>${esc([r.from_name, track].filter(Boolean).join(" · "))}</span></span>
      <span class="nt-span">${esc(span)}</span>
      <span class="nt-end right"><strong>${esc(arr || "—")}</strong><span>${esc(last.to_name || "")}</span></span></div>` : ""}
    ${legs.length > 1 ? journeyLegs(legs, cur) : ""}
    ${r.notes ? `<div class="nt-notes">${esc(r.notes)}</div>` : ""}
    <div class="tk-actions">${live
      ? (tracked ? `<button type="button" class="btn small tracking-btn" data-select="${esc(live.id)}">${BELL_ICON}${T("Tracking")}</button>`
        : `<button type="button" class="btn primary small track-btn" data-near-track="${esc(live.id)}">${BELL_ICON}${T("Track")}</button>`) +
        `<button type="button" class="btn small" data-select="${esc(live.id)}">${T("On the map")}</button>`
      : `<span class="tk-note">${BELL_ICON}${T("Tracked for you on the day")}</span><button type="button" class="btn small" data-trip="${esc(r.id)}">${T("Details")}</button>`}</div>
  </div>`;
}

// ---------- Trips with connections ----------
// A trip on more than one train: each train is a row of its own, the rows
// sharing a journey id (js/account.js). Shown as one trip, its trains in
// order, with where the change is and how long it leaves between them.
function journeysOf(rows) {
  const out = [], by = new Map();
  for (const r of rows) {
    if (!r.journey) { out.push([r]); continue; }
    let j = by.get(r.journey);
    if (!j) { by.set(r.journey, (j = [])); out.push(j); }
    j.push(r);
  }
  const at = (r) => r.service_date + (r.depart_at || "");
  for (const j of out) j.sort((x, y) => at(x).localeCompare(at(y)));
  return out;
}
const legsAt = (legs) => legs[0].service_date + (legs[0].depart_at || "");
// The changes between a trip's trains: where, and how long between them.
const changesOf = (legs) => legs.slice(1).map((r, i) => {
  const wait = Date.parse(r.depart_at) - Date.parse(legs[i].arrive_at);
  return { place: legs[i].to_name || r.from_name || "", wait: wait >= 0 && wait < 86400000 ? wait : null };
});
const changeText = (c) => (c.wait != null ? T("Change at {place} · {wait}", { place: c.place, wait: fmtSpan(c.wait) }) : T("Change at {place}", { place: c.place }));
const tripName = (legs) => legs.map((l) => l.route || AGENCIES[l.agency]?.name || l.agency).join(" → ");
// The trains, one under the other, and each change between them: on the
// next trip's card, and History's.
function journeyLegs(legs, cur = null) {
  const changes = changesOf(legs);
  return `<ol class="jl">${legs.map((l, i) => {
    const la = AGENCIES[l.agency] || { short: l.agency, name: l.agency, color: "#888" };
    const times = [tripTime(l.depart_at, l.from_key, l.agency), tripTime(l.arrive_at, l.to_key, l.agency)].filter(Boolean).join(" – ");
    return (i ? `<li class="jl-change">${esc(changeText(changes[i - 1]))}</li>` : "") +
      `<li class="jl-leg${l === cur ? " now" : ""}" style="--c:${la.color}">${plate(l.number || la.short, la.color, "xs")}
        <span class="jl-text"><span class="title">${esc(l.route || la.name)}</span><span class="sub">${esc([[l.from_name, l.to_name].filter(Boolean).join(" → "), times].filter(Boolean).join(" · "))}</span></span></li>`;
  }).join("")}</ol>`;
}
// Time on each train, and waiting between them, end to end.
function journeyBar(legs) {
  const t0 = Date.parse(legs[0].depart_at), t1 = Date.parse(legs[legs.length - 1].arrive_at);
  if (!(t1 > t0) || legs.some((l) => !(Date.parse(l.arrive_at) > Date.parse(l.depart_at)))) return "";
  const pct = (ms) => `${((ms / (t1 - t0)) * 100).toFixed(2)}%`;
  let at = t0, html = "";
  for (const l of legs) {
    const a = Date.parse(l.depart_at), b = Date.parse(l.arrive_at);
    if (a > at) html += `<span class="jb-wait" style="width:${pct(a - at)}"></span>`;
    html += `<span class="jb-ride" style="width:${pct(b - Math.max(a, at))};--c:${AGENCIES[l.agency]?.color || "#888"}"></span>`;
    at = b;
  }
  return `<span class="jbar" aria-hidden="true">${html}</span>`;
}
// A trip with connections in a list (My trips): its day, its trains' names,
// from and to, how many changes and when it leaves, and the bar.
function journeyRow(legs) {
  const r = legs[0], last = legs[legs.length - 1];
  const d = new Date(`${r.service_date}T12:00:00Z`);
  const month = dateFormat({ month: "short", timeZone: "UTC" }).format(d), day = d.getUTCDate();
  const sub = [[r.from_name, last.to_name].filter(Boolean).join(" → "), Tn(legs.length - 1, "1 change", "{n} changes"), tripTime(r.depart_at, r.from_key, r.agency)].filter(Boolean).join(" · ");
  return `<button type="button" class="home-row trip-row journey-row" data-trip="${esc(r.id)}">
      <span class="tr-date"><span>${esc(month)}</span><strong>${day}</strong></span>
      <span class="home-row-text"><span class="title">${esc(tripName(legs))}</span><span class="sub">${esc(sub)}</span>${journeyBar(legs)}</span>
      <span class="tr-bell" title="${T("Tracked on the day")}">${BELL_ICON}</span>
    </button>`;
}
// History: a trip with connections as a card of its own, each train on a
// line in its railroad's color, the change between them marked, and the bar.
function journeyCard(legs) {
  const r = legs[0], last = legs[legs.length - 1];
  const took = Date.parse(last.arrive_at) - Date.parse(r.depart_at);
  const meta = [Tn(legs.length, "1 train", "{n} trains"), took > 0 && took < 4 * 86400000 ? fmtSpan(took) : ""].filter(Boolean).join(" · ");
  return `<button type="button" class="journey-card" data-trip="${esc(r.id)}">
      <span class="jc-head"><strong>${esc([r.from_name, last.to_name].filter(Boolean).join(" → ") || tripName(legs))}</strong><span>${esc([tripDate(r.service_date), meta].join(" · "))}</span></span>
      ${journeyLegs(legs)}
      ${journeyBar(legs)}
    </button>`;
}

// A planned trip that has gone by: did the rider take it?
const confirmRow = (legs) => {
  const r = legs[0], last = legs[legs.length - 1];
  const a = AGENCIES[r.agency] || { short: r.agency, name: r.agency, color: "#888" };
  const leg = [r.from_name, last.to_name].filter(Boolean).join(" → ");
  return `<div class="home-row trip-row confirm-row">
    <button type="button" class="confirm-open" data-trip="${esc(r.id)}">${plate(r.number || a.short, a.color, "xs")}
      <span class="home-row-text"><span class="title">${esc(tripName(legs))}</span><span class="sub">${esc([leg, tripDate(r.service_date)].filter(Boolean).join(" · "))}</span></span></button>
    <button type="button" class="btn small" data-trip-taken="${esc(r.id)}">${T("I took it")}</button>
  </div>`;
};

function myTripsHtml() {
  const head = pageHead(T("My trips"), signedInHere()
    ? `<button type="button" class="icon-btn page-add" data-trip-add aria-label="${esc(T("Add a train"))}" title="${esc(T("Add a train"))}">${PLUS_ICON}</button>` : "");
  if (!signedInHere()) return head + signedOutHtml("trips");
  const all = account?.trips?.();
  if (!all) return head + `<div class="trip-card"><span class="sk sk-line"></span><span class="sk sk-line short"></span></div>`;
  const day = account.today();
  // By trip: a trip with connections is upcoming until its last train is in.
  const trips = journeysOf(all).filter((j) => j.every((r) => r.status === "planned")).sort((x, y) => legsAt(x).localeCompare(legsAt(y)));
  const [next, ...rest] = trips.filter((j) => account.isUpcoming(j[j.length - 1]));
  const unsure = trips.filter((j) => !account.isUpcoming(j[j.length - 1]) && j[0].service_date >= addDaysIso(day, -3));
  let html = head;
  html += next ? nextTripCard(next) : `<div class="trips-empty"><p>${T("No trips planned. Tap + to add the trains you'll take: they're tracked for you on the day.")}</p></div>`;
  if (unsure.length) html += `<div class="group-title">${T("Did you take these?")}</div>` + unsure.map(confirmRow).join("");
  const week = addDaysIso(day, 6);
  const soon = rest.filter((j) => j[0].service_date <= week), later = rest.filter((j) => j[0].service_date > week);
  const row = (j) => (j.length > 1 ? journeyRow(j) : tripRowHome(j[0]));
  if (soon.length) html += `<div class="group-title">${T("This week")}</div>` + soon.map(row).join("");
  if (later.length) html += `<div class="group-title">${T("Later")}</div>` + later.map(row).join("");
  return html;
}

// ---------- History ----------
// Trips taken: how many, how many stations, how long on board and how far
// (along the track where Trainsheet has it), the train ridden most (its
// usual cars, drawn), the top railroad and station, and every trip by month.

const tripPlace = (key, name, agency) => (key && state.stopPos.get(key)) || (name && state.stopByName.get(`${agency}:${norm(name)}`)) || null;
const tripMetersCache = new Map();
function tripMeters(r) {
  const a = tripPlace(r.from_key, r.from_name, r.agency), b = tripPlace(r.to_key, r.to_name, r.agency);
  if (!a || !b) return 0;
  const key = `${r.agency}|${a.lat},${a.lon}|${b.lat},${b.lon}`;
  if (tripMetersCache.has(key)) return tripMetersCache.get(key);
  if (!state.rail || !needTrack(r.agency)) return meters(a, b);
  const coords = traceLeg(a, b, r.agency);
  let m = 0;
  for (let i = 1; i < coords.length; i++) m += meters({ lon: coords[i - 1][0], lat: coords[i - 1][1] }, { lon: coords[i][0], lat: coords[i][1] });
  tripMetersCache.set(key, m);
  return m;
}
// A train's cars as their models: "ACS-64 + Amfleet I".
function modelsLine(c) {
  const names = [...new Set(c.cars.map((x) => x.type?.name).filter(Boolean))];
  return names.length > 3 ? `${names.slice(0, 2).join(" + ")} ${T("+ {n} more", { n: names.length - 2 })}` : names.join(" + ");
}
const stationOfTrip = (key, name, agency) => (key && state.stationOfKey?.get(key)) || (name ? `${agency}:${fold(name)}` : null);
const stationLabel = (id) => state.stations.get(id)?.name || null;

function historyHtml() {
  if (!signedInHere()) return pageHead(T("History")) + signedOutHtml("history");
  const all = account?.taken?.();
  if (!all) return pageHead(T("History")) + `<div class="trip-card"><span class="sk sk-line"></span><span class="sk sk-line short"></span></div>`;
  const years = [...new Set(all.map((r) => r.service_date.slice(0, 4)))].sort().reverse();
  if (state.historyYear && !years.includes(state.historyYear)) state.historyYear = "";
  const yearPick = years.length > 1 ? `<label class="filter${state.historyYear ? " on" : ""}"><span>${esc(state.historyYear || T("All time"))}</span><svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M7 9.5 12 14.5 17 9.5Z"/></svg>
      <select data-history-year aria-label="${esc(T("Year"))}"><option value="">${esc(T("All time"))}</option>${years.map((y) => `<option value="${y}"${y === state.historyYear ? " selected" : ""}>${y}</option>`).join("")}</select></label>` : "";
  const head = pageHead(T("History"), yearPick);
  const list = all.filter((r) => !state.historyYear || r.service_date.startsWith(state.historyYear))
    .sort((x, y) => (y.service_date + (y.depart_at || "")).localeCompare(x.service_date + (x.depart_at || "")));
  if (!list.length) {
    return head + `<div class="trips-empty"><p>${T("No trips yet. Trains you track to your stop while riding are added here when you arrive, and trips you planned once you say you took them.")}</p></div>`;
  }
  // The numbers: trips counted whole (one with connections is one trip),
  // the rest by train.
  const journeys = journeysOf(list);
  const stations = new Set(list.flatMap((r) => [stationOfTrip(r.from_key, r.from_name, r.agency), stationOfTrip(r.to_key, r.to_name, r.agency)]).filter(Boolean));
  let onBoard = 0;
  for (const r of list) {
    const ms = Date.parse(r.arrive_at) - Date.parse(r.depart_at);
    if (ms > 0 && ms < 4 * 86400000) onBoard += ms;
  }
  const dist = list.reduce((m, r) => m + tripMeters(r), 0);
  const mins = Math.round(onBoard / 60000), hours = Math.floor(mins / 60);
  const time = hours ? `${hours.toLocaleString(locale)}<small>${T("h")}</small> ${mins % 60}<small>${T("min")}</small>` : `${mins}<small>${T("min")}</small>`;
  const km = state.units === "km", d = dist / (km ? 1000 : 1609.344);
  const stats = `<div class="rr-stats hist-stats">
    ${statTile(journeys.length.toLocaleString(locale), esc(Tn(journeys.length, "trip taken", "trips taken")))}
    ${statTile(stations.size.toLocaleString(locale), esc(Tn(stations.size, "station", "stations")))}
    ${statTile(time, esc(T("on board")))}
    ${statTile(`${Math.round(d).toLocaleString(locale)}<small>${km ? "km" : "mi"}</small>`, esc(T(km ? "kilometers ridden" : "miles ridden")))}
  </div>`;
  // The train ridden most: the usual cars of each trip's train, counted.
  const consists = new Map();
  for (const r of list) {
    const c = consistOf({ id: `hist:${r.id}`, agency: r.agency, route: r.route || undefined, number: r.number || undefined });
    if (!c?.cars?.length) continue;
    const sig = `${r.agency}|${c.cars.map((x) => x.type?.name || "").join(",")}`;
    const e = consists.get(sig) || { n: 0, c, agency: r.agency };
    e.n++;
    consists.set(sig, e);
  }
  const most = [...consists.values()].sort((x, y) => y.n - x.n)[0];
  const mostHtml = most ? `<div class="hist-most">
      <div class="hm-label">${T("Ridden most")}</div>
      <div class="hm-cars">${consistHtml(most.c, AGENCIES[most.agency]?.color, "histmost")}</div>
      <div class="hm-name">${esc(modelsLine(most.c))}</div>
      <div class="hm-sub">${esc(`${AGENCIES[most.agency]?.short || most.agency} · ${list.length > journeys.length ? T("{k} of your {n} trains", { k: most.n, n: list.length }) : T("{k} of your {n} trips", { k: most.n, n: list.length })}`)}</div>
    </div>` : "";
  // The top railroad and station.
  const tally = (keys) => { const m = new Map(); for (const k of keys) if (k) m.set(k, (m.get(k) || 0) + 1); return [...m].sort((x, y) => y[1] - x[1])[0]; };
  const topRr = tally(list.map((r) => r.agency));
  const topSt = tally(list.flatMap((r) => [stationOfTrip(r.from_key, r.from_name, r.agency), stationOfTrip(r.to_key, r.to_name, r.agency)]));
  const topName = topSt && (stationLabel(topSt[0]) || list.flatMap((r) => [[stationOfTrip(r.from_key, r.from_name, r.agency), r.from_name], [stationOfTrip(r.to_key, r.to_name, r.agency), r.to_name]]).find(([id]) => id === topSt[0])?.[1]);
  const tops = `<div class="group-title">${T("Favorites")}</div>
    ${topRr ? `<button type="button" class="home-row" data-railroad="${esc(topRr[0])}"><span class="home-row-text"><span class="title">${esc(AGENCIES[topRr[0]]?.name || topRr[0])}</span><span class="sub">${esc(T("Top railroad · {n}", { n: Tn(topRr[1], "1 trip", "{n} trips") }))}</span></span><span class="count">›</span></button>` : ""}
    ${topName ? `<button type="button" class="home-row"${state.stations.has(topSt[0]) ? ` data-station="${esc(topSt[0])}"` : ""}><span class="home-row-text"><span class="title">${esc(topName)}</span><span class="sub">${esc(T("Top station · {n}", { n: Tn(topSt[1], "1 visit", "{n} visits") }))}</span></span><span class="count">›</span></button>` : ""}`;
  // Every trip, by month.
  let month = "", rows = "";
  const thisYear = String(new Date().getFullYear());
  for (const legs of journeys.sort((x, y) => legsAt(y).localeCompare(legsAt(x)))) {
    const m = legs[0].service_date.slice(0, 7);
    if (m !== month) {
      month = m;
      rows += `<div class="group-title">${esc(dateFormat({ month: "long", year: m.startsWith(thisYear) ? undefined : "numeric", timeZone: "UTC" }).format(new Date(`${m}-15T12:00:00Z`)))}</div>`;
    }
    rows += legs.length > 1 ? journeyCard(legs) : tripRowHome(legs[0]);
  }
  return head + stats + mostHtml + tops + rows;
}

function tripRowHome(r) {
  const a = AGENCIES[r.agency] || { short: r.agency, name: r.agency, color: "#888" };
  const d = new Date(`${r.service_date}T12:00:00Z`);
  const month = dateFormat({ month: "short", timeZone: "UTC" }).format(d), day = d.getUTCDate();
  const leg = [r.from_name, r.to_name].filter(Boolean).join(" → ");
  const past = r.status !== "planned";
  const took = Date.parse(r.arrive_at) - Date.parse(r.depart_at);
  const when = past ? [tripDate(r.service_date), took > 0 && took < 4 * 86400000 ? fmtSpan(took) : ""].filter(Boolean).join(" · ")
    : [tripTime(r.depart_at, r.from_key, r.agency), r.service_date.slice(0, 4) !== String(new Date().getFullYear()) ? r.service_date.slice(0, 4) : ""].filter(Boolean).join(" · ");
  return `<button type="button" class="home-row trip-row" data-trip="${esc(r.id)}">
      ${past ? plate(r.number || a.short, a.color, "xs") : `<span class="tr-date"><span>${esc(month)}</span><strong>${day}</strong></span>`}
      <span class="home-row-text"><span class="title">${esc([past ? "" : a.short, r.route || (past ? a.name : ""), r.number && !past ? r.number : ""].filter(Boolean).join(" "))}</span>
        <span class="sub">${esc([leg, when].filter(Boolean).join(" · "))}</span></span>
      ${past ? "" : `<span class="tr-bell" title="${T("Tracked on the day")}">${BELL_ICON}</span>`}
    </button>`;
}

// Trips planned for today are tracked by themselves, to the stop they're
// planned to, once their train is out and reporting: each once (untracking
// one leaves it be).
function trackPlanned() {
  const list = account?.upcoming?.();
  if (!list?.length) return;
  const today = account.today();
  let done = store.get("tt-autotracked", []);
  for (const r of list) {
    if (r.service_date !== today) break;
    if (done.includes(r.id) || state.tracked.length >= MAX_TRACKED) continue;
    const t = tripTrain(r);
    if (!t || state.tracked.some((x) => x.id === t.id)) continue;
    const stop = stopOfTrip(t, r.to_key, r.to_name);
    done = [r.id, ...done].slice(0, 50);
    store.set("tt-autotracked", done);
    if (stop?.status === "past") continue;
    startTracking(t, stop?.key || null, { fromKey: stopOfTrip(t, r.from_key, r.from_name)?.key || null, riding: true });
    toast(T("Tracking {train}, your trip today.", { train: trainLabel({ agency: t.agency, number: t.number }) }));
  }
}

// ---------- Near you ----------
// The trains closest to the reader, on the home list: each opens its page,
// and its Track button asks where they're getting off. The position is asked
// for only when they press "Find trains near me" (and, once they've allowed
// it, on their next visits), kept in memory for the visit and never sent
// anywhere; it's checked again every couple of minutes while the list shows.
const NEAR_COUNT = 5;
const NEAR_MAX_M = 160934;            // 100 miles
const NEAR_REFRESH_MS = 2 * 60 * 1000;
const PIN_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.4" fill="currentColor"/></svg>';
const REFRESH_ICON = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4v4.5H15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
let nearFix = null;                   // { lat, lon, at }
let nearState = "idle";               // idle | locating | ok | denied | unavailable
let nearAsking = false;
function locateNear({ quiet = false } = {}) {
  if (!navigator.geolocation) {
    nearState = "unavailable";
    return renderNearby();
  }
  if (nearAsking) return;
  nearAsking = true;
  if (!quiet) {
    nearState = "locating";
    renderNearby();
  }
  navigator.geolocation.getCurrentPosition((pos) => {
    nearAsking = false;
    nearFix = { lat: pos.coords.latitude, lon: pos.coords.longitude, at: Date.now() };
    nearState = "ok";
    store.set("tt-near", true);
    wakeSources(); // railroads near the reader, though off screen
    renderNearby();
  }, (err) => {
    nearAsking = false;
    if (quiet && nearFix) return;     // keep the last place
    nearState = err.code === 1 ? "denied" : "unavailable";
    if (err.code === 1) store.set("tt-near", false);
    renderNearby();
  }, { enableHighAccuracy: false, maximumAge: 60000, timeout: 15000 });
}
// Allowed on an earlier visit: find them again without asking.
if (store.get("tt-near", false)) {
  navigator.permissions?.query({ name: "geolocation" }).then((p) => { if (p.state === "granted") locateNear(); }).catch(() => {});
}
function fmtDist(m) {
  if (state.units === "km") return m < 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m / 1000)} km`;
  const mi = m / 1609.344;
  return mi < 10 ? `${mi.toFixed(1)} mi` : `${Math.round(mi)} mi`;
}
// The nearest trains, nearest first, and whether each is coming toward the
// reader (its heading within 60° of the way to them).
function nearestTrains() {
  const out = [];
  for (const t of state.trains.values()) {
    if (!inLists(t)) continue;
    const p = state.display.get(t.id) || targetOf(t);
    if (!p) continue;
    const d = meters(nearFix, p);
    if (d > NEAR_MAX_M) continue;
    const b = t.bearing ?? state.est.get(t.id)?.bearing;
    const toward = b == null || d < 300 ? null : Math.abs(((compassBearing(p, nearFix) - b) % 360 + 540) % 360 - 180) < 60;
    out.push({ t, d, toward });
  }
  return out.sort((x, y) => x.d - y.d).slice(0, NEAR_COUNT);
}
// Near you, at the top of the home list (renderAgencies).
function renderNearby() {
  if (!state.query.trim()) renderAgencies();
}
function nearbyHtml() {
  if (nearState === "ok" && Date.now() - nearFix.at > NEAR_REFRESH_MS && !document.hidden) locateNear({ quiet: true });
  const head = `<div class="group-title near-title"><span>${T("Near you")}</span>${nearState === "ok"
    ? `<button type="button" class="near-refresh" data-near-locate aria-label="${T("Update my location")}" title="${T("Update my location")}">${REFRESH_ICON}</button>` : ""}</div>`;
  if (nearState !== "ok") {
    const sub = {
      locating: T("Finding you…"),
      denied: T("Location is off for Trainsheet. Allow it in your browser's settings to see trains near you."),
      unavailable: T("Your location isn't available right now."),
    }[nearState] || T("The closest trains, ready to track. Your location stays on this device.");
    return head + `<div class="near-row"><button type="button" class="result near-btn" data-near-locate${nearState === "locating" ? " disabled" : ""}>
      <span class="near-pin">${PIN_ICON}</span>
      <span><span class="title">${T("Find trains near me")}</span><br><span class="sub">${esc(sub)}</span></span>
    </button></div>`;
  }
  const list = nearestTrains();
  if (!list.length) return head + `<div class="near-row"><p class="near-note">${esc(T("No trains within {d} right now.", { d: fmtDist(NEAR_MAX_M) }))}</p></div>`;
  return head + list.map(({ t, d, toward }) => {
    const a = AGENCIES[t.agency], tracked = state.tracked.some((r) => r.id === t.id);
    const next = t.stops?.find((s) => s.status === "next")?.name || t.nextStop;
    const away = fmtDist(d) + (toward === true ? ` · ${T("coming your way")}` : toward === false ? ` · ${T("heading away")}` : "");
    // Its status names the stop already ("At Hoboken"): not twice.
    const status = trainStatus(t).text;
    const where = next && !(status && status.includes(next)) ? T("next {place}", { place: next })
      : !next && t.destination ? T("to {place}", { place: t.destination }) : "";
    // One line each, the plate in a column of its own, as in the home's other
    // lists; its status first on its line, so a long stop name is what's cut.
    return `<div class="near-row">
      <button type="button" class="result near-train" data-select="${esc(t.id)}">
        <span class="near-plate">${plate(t.number || a.short, a.color, "xs")}</span>
        <span class="near-text"><span class="title">${esc(trainTitle(t))}</span><span class="sub">${esc([a.short, away].join(" · "))}</span>${where || status
          ? `<span class="sub">${statusSpan(t, "status")}${where && status ? " · " : ""}${esc(where)}</span>` : ""}</span>
      </button>
      ${tracked ? `<span class="near-tracking">${BELL_ICON}${T("Tracking")}</span>`
        : `<button type="button" class="btn primary small track-btn" data-near-track="${esc(t.id)}">${BELL_ICON}${T("Track")}</button>`}
    </div>`;
  }).join("");
}

// The open licenses some plug-in railroads publish under, which ask for
// attribution: named, and linked, beside their credit.
const LICENSES = {
  "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/",
  "CC BY 3.0 AU": "https://creativecommons.org/licenses/by/3.0/au/",
  "CC BY 2.5 AR": "https://creativecommons.org/licenses/by/2.5/ar/",
  "CC BY 1.0": "https://creativecommons.org/licenses/by/1.0/",
  "CC0": "https://creativecommons.org/publicdomain/zero/1.0/",
  "ODbL": "https://opendatacommons.org/licenses/odbl/1-0/",
  "NLOD": "https://data.norge.no/nlod/en/2.0",
};
// A license as given ("CC BY 4.0", or "CC BY 4.0 (timetable)"), linked to its text.
const licenseHtml = (license) => {
  const k = Object.keys(LICENSES).find((k) => license === k || license.startsWith(`${k} `));
  return k ? `<a href="${LICENSES[k]}" target="_blank" rel="noopener">${esc(license)}</a>` : esc(license);
};
const creditHtml = ({ label, href, license }) => `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}</a>` +
  (license ? ` (${licenseHtml(license)})` : "");
function renderCredits() {
  const seen = new Map();
  // A view-scoped source is credited once its data has been shown.
  for (const s of SOURCES) {
    const avail = sourceAvailability(s), credit = creditOf(s, avail.timetable);
    if (avail.ok && (!viewScoped(s) || state.sourceStatus[s.id]?.at)) seen.set(credit.label, credit);
  }
  // A railroad abroad, once its region's stations and timetables are in,
  // though its feed may be off or down.
  for (const id of regionAgencies) {
    const a = AGENCIES[id];
    if (a?.credit && !seen.has(a.credit.label)) seen.set(a.credit.label, { ...a.credit, license: a.license });
  }
  setPane($("credits"), T("Data:") + " " + [...seen.values()].map(creditHtml).join(", ") +
    `. ${T("Map")} © <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a>, <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>.`);
}

// A train's status, said the same way everywhere (lists, its page, the
// map's card): how late it is, by lateText(); without a delay, what its
// railroad says if that isn't about lateness ("Held at New Haven", in
// orange; "At Yonkers"), else nothing.
function trainStatus(t) {
  if (t.cancelled) return { text: T("Cancelled"), cls: "warn" };
  if (t.delayMin != null && !Number.isNaN(t.delayMin)) return lateText(t.delayMin);
  if (!t.statusText || /^On time$|late$/.test(t.statusText)) return { text: "", cls: "neutral" };
  return { text: statusLabel(t.statusText), cls: /^Held /.test(t.statusText) ? "warn" : "neutral" };
}
// As a span: "status" in lists, "pill" on a train's page, "status-t" on
// the map's card. A delay Trainsheet worked out from GPS is underlined.
function statusSpan(t, kind) {
  const st = trainStatus(t);
  if (!st.text) return "";
  const inferred = Boolean(t.inferred) && t.delayMin != null;
  return `<span class="${kind} ${st.cls}${inferred ? " inferred" : ""}"${inferred ? ` title="${INFERRED_TITLE}"` : ""}>${esc(st.text)}</span>`;
}

// The train's live card: the next stop (how soon, and its time) in one
// tile, and beside it the speed, where the train's GPS reports one; without
// it, the next stop takes the whole width. Under them, where the position
// comes from.
function factTiles(t) {
  const next = t.stops?.find((s) => s.status === "next") || t.stops?.find((s) => s.status === "future");
  const nextName = next?.name || t.nextStop;
  const at = next && Date.parse(next.time);
  const tiles = [];
  if (nextName) {
    tiles.push(`<div class="ft ft-next"><span class="ft-label">${T("Next stop")}</span><span class="ft-value"><span class="ft-name">${esc(nextName)}</span></span>
      ${at ? `<span class="ft-sub">${esc(fmtIn(at) === T("now") ? T("Arriving now") : T("in {time}", { time: fmtIn(at) }))} · ${esc(fmtTime(next.time, next.tz))}</span>` : ""}</div>`);
  }
  if (t.speedMph != null && !t.estimated) {
    const km = unitsOf(t.agency) === "km", v = Math.round(km ? t.speedMph * KM_PER_MI : t.speedMph);
    tiles.push(`<div class="ft ft-speed"><span class="ft-label">${T("Speed")}</span><span class="ft-value">${v}<small>${km ? "km/h" : T("mph")}</small></span></div>`);
  }
  const note = t.estimated ? `${T("Estimated from predicted times")} · ${fmtAgo(t.updated)}` : `${T("GPS")} · ${fmtAgo(t.updated)}`;
  // A railroad's own last report of it (a detail source's).
  const seen = t.reported ? ` · ${T("Last reported at {station}, {time}", { station: t.reported.station, time: fmtTime(new Date(t.reported.at).toISOString(), AGENCIES[t.agency]?.tz) })}` : "";
  return `<div class="facts">${tiles.length ? `<div class="ft-tiles">${tiles.join("")}</div>` : ""}${likelyLine(t)}<p class="ft-note">${t.estimated ? "" : SIGNAL_ICON}${esc(note + seen)}</p></div>`;
}

function trainTitle(t) {
  const a = AGENCIES[t.agency];
  return t.route ? `${t.route}` : a.name;
}

// What was opened lately, newest first: chips under the search box that
// open it again. Trains no longer running drop out of view.
const MAX_RECENTS = 8;
function remember(item) {
  if (goingBack) return;
  state.recents = [item, ...state.recents.filter((r) => !(r.kind === item.kind && r.id === item.id))].slice(0, MAX_RECENTS * 2);
  store.set("tt-recents", state.recents);
}

function renderRecents() {
  const el = $("recents");
  const shown = state.recents.filter((r) => AGENCIES[r.agency] && (r.kind !== "train" ? true : state.trains.has(r.id))
    && (r.kind !== "station" || state.stations.has(r.id))).slice(0, MAX_RECENTS);
  el.hidden = !shown.length;
  if (!shown.length) return;
  setPane(el, `<div class="recents-head"><span class="group-title">${T("Recent")}</span><button type="button" class="link-btn" data-recents-clear>${T("Clear")}</button></div>
    <div class="recents-row">${shown.map((r) => {
      const a = AGENCIES[r.agency];
      const icon = r.kind === "train" ? plate(r.number || a.short, a.color, "xs")
        : r.kind === "station" ? `<span class="rc-station" style="--c:${a.color}"></span>`
        : r.kind === "line" ? lineMark(r.agency, r.name)
        : `<span class="rc-rr" style="--c:${a.color}"></span>`;
      return `<button type="button" class="recent" data-recent-kind="${r.kind}" data-recent-id="${esc(r.id)}">${icon}<span>${esc(r.name)}</span></button>`;
    }).join("")}</div>`);
}

// Search's filters: a type (intercity, or commuter and regional), a
// country, a network (a railroad's region: New York, Toronto, Madrid...),
// and a railroad. Each one's choices are those the others leave.
const FILTER_KINDS = { intercity: "Intercity", commuter: "Commuter & regional" };
const filtersOn = () => Object.values(state.filters).some(Boolean);
function agencyFiltered(id, skip = null) {
  const f = state.filters, a = AGENCIES[id];
  return Boolean(a) && (skip === "kind" || !f.kind || a.kind === f.kind) && (skip === "country" || !f.country || a.country === f.country)
    && (skip === "region" || !f.region || regionOf(a) === f.region) && (skip === "agency" || !f.agency || id === f.agency);
}
function filterChoices(key) {
  const ids = Object.keys(AGENCIES).filter((id) => agencyFiltered(id, key));
  const pairs = key === "kind" ? Object.entries(FILTER_KINDS).filter(([k]) => ids.some((id) => AGENCIES[id].kind === k)).map(([k, label]) => [k, T(label)])
    : key === "country" ? [...new Set(ids.map((id) => AGENCIES[id].country))].map((c) => [c, countryName(c)])
    : key === "region" ? [...new Set(ids.map((id) => regionOf(AGENCIES[id])).filter(Boolean))].map((r) => [r, r])
    : ids.map((id) => [id, AGENCIES[id].name]);
  return key === "kind" ? pairs : pairs.sort((x, y) => byName(x[1], y[1]));
}
const FILTERS = [["kind", "Type"], ["country", "Country"], ["region", "Network"], ["agency", "Railroad"]];
function renderFilters() {
  const el = $("filters");
  if (!el) return;
  // A choice the others no longer leave is let go.
  for (const [key] of FILTERS) if (state.filters[key] && !filterChoices(key).some(([v]) => v === state.filters[key])) state.filters[key] = "";
  el.closest(".search-area")?.classList.toggle("active", Boolean(state.query.trim()) || filtersOn());
  setPane(el, FILTERS.map(([key, label]) => {
    const v = state.filters[key], choices = filterChoices(key);
    const shown = v ? choices.find(([k]) => k === v)?.[1] : T(label);
    return `<label class="filter${v ? " on" : ""}"><span>${esc(shown)}</span><svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M7 9.5 12 14.5 17 9.5Z"/></svg>
      <select data-filter="${key}" aria-label="${esc(T(label))}"><option value="">${esc(T(key === "kind" ? "Any type" : key === "country" ? "Any country" : key === "region" ? "Any network" : "Any railroad"))}</option>${choices.map(([k, name]) =>
        `<option value="${esc(k)}"${k === v ? " selected" : ""}>${esc(name)}</option>`).join("")}</select></label>`;
  }).join("") + (filtersOn() ? `<button type="button" class="link-btn filter-clear" data-filters-clear>${T("Clear")}</button>` : ""));
}

// Browse: a train's add button, or its tick once it's in My trips (where
// accounts are on; signed out, it asks to sign in).
const addBtn = (added, attrs, name) => !accountsOn() ? ""
  : added ? `<span class="add-btn added" role="img" title="${esc(T("In My trips"))}" aria-label="${esc(T("In My trips"))}">${TICK_ICON}</span>`
  : `<button type="button" class="add-btn" ${attrs} title="${esc(T("Add to My trips"))}" aria-label="${esc(T("Add {train} to My trips", { train: name }))}">${PLUS_ICON}</button>`;
const hasTrip = (agency, number, day) => Boolean(account?.has?.(agency, number, day));

// Browse, from one station to another: "penn to philadelphia", "Boston →
// New York": the trains between them on the day picked (today, tomorrow or
// any date), from the railroads' timetables, each added in one tap.
function routeQuery(text) {
  const parts = text.split(/\s*(?:→|->|⇒|>)\s*|\s+(?:to|à|vers)\s+/i).map((x) => x.trim()).filter(Boolean);
  if (parts.length !== 2 || parts.some((x) => x.length < 3)) return null;
  const [from] = searchStations(parts[0], 1), [to] = searchStations(parts[1], 1);
  return from && to && from.id !== to.id ? { from, to } : null;
}
const routeTrains = new Map(); // "from|to|day" -> { trains, exact }, or "loading"
let routeShown = null;          // { day, trains } as Browse lists them
function routeHtml({ from, to }) {
  const day = state.routeDay || localDay(), t0 = localDay(), t1 = addDaysIso(t0, 1);
  const key = `${from.id}|${to.id}|${day}`;
  if (!routeTrains.has(key)) {
    routeTrains.set(key, "loading");
    findTrains(from.id, to.id, day).catch(() => ({ trains: [], exact: true }))
      .then((r) => { routeTrains.set(key, r); renderResults(); });
  }
  const got = routeTrains.get(key);
  const other = day !== t0 && day !== t1;
  const chip = (d, label) => `<button type="button" class="filter${day === d ? " on" : ""}" data-route-day="${d}" aria-pressed="${day === d}">${label}</button>`;
  const head = `<div class="group-title route-title">${esc(from.name)} → ${esc(to.name)}</div>
    <div class="route-days">${chip(t0, T("Today"))}${chip(t1, T("Tomorrow"))}<label class="filter${other ? " on" : ""}"><span>${esc(other ? tripDate(day) : T("Pick a date"))}</span><input type="date" data-route-date value="${esc(day)}" aria-label="${esc(T("Another day"))}"></label></div>`;
  if (got === "loading") return head + skeletonRows(3);
  // Today's from a quarter of an hour ago on.
  const trains = got.trains.filter((r) => day !== t0 || Date.parse(r.departAt) > Date.now() - 15 * 60000);
  routeShown = { day, trains };
  if (!trains.length) return head + `<p class="empty">${T("No trains between these stations that day.")}</p>`;
  return head + trains.slice(0, 40).map((r, i) => {
    const a = AGENCIES[r.agency] || { color: "#888", short: r.agency };
    const live = day === t0 && r.number ? [...state.trains.values()].find((t) => t.agency === r.agency && String(t.number) === String(r.number)) : null;
    const name = [a.short, r.number].filter(Boolean).join(" ");
    return `<div class="result-row">
      <button type="button" class="result" ${live ? `data-select="${esc(live.id)}"` : `data-route-pick="${i}"`}>
        ${plate(r.number || a.short, a.color, "sm")}
        <span><span class="title">${esc(fmtTime(r.departAt, r.fromTz))} – ${esc(fmtTime(r.arriveAt, r.toTz))}</span><br><span class="sub">${esc([r.route, a.short, fmtSpan(Date.parse(r.arriveAt) - Date.parse(r.departAt))].filter(Boolean).join(" · "))}</span></span>
        ${live ? statusSpan(live, "status") : "<span></span>"}
      </button>${addBtn(hasTrip(r.agency, r.number, day), `data-add-route="${i}"`, name)}</div>`;
  }).join("") + (got.exact ? "" : `<p class="results-more">${T("Trains on that weekday, as the timetable runs now.")}</p>`);
}
let laterShown = new Map(); // a train later today's key -> the train, as Browse lists them

function renderResults() {
  // Matched with accents dropped, in any script: "hameenlinna" finds Hämeenlinna.
  const q = fold(state.query.trim());
  const el = $("results");
  // Search is Browse's: the other pages show their own.
  if (state.tab !== "browse") {
    el.hidden = true;
    $("agencies").hidden = false;
    return;
  }
  renderFilters();
  if (!q && !filtersOn()) {
    el.hidden = true;
    $("agencies").hidden = false;
    renderRecents();
    return;
  }
  el.hidden = false;
  $("agencies").hidden = true;
  $("recents").hidden = true;
  const terms = q.split(/\s+/);
  const matches = [];
  for (const t of state.trains.values()) {
    if (!inLists(t) || !agencyFiltered(t.agency)) continue;
    const a = AGENCIES[t.agency];
    const hay = fold(`${a.name} ${a.short} ${a.region} ${t.number} ${t.route} ${t.origin} ${t.destination} ${t.nextStop}`);
    if (!terms.every((w) => hay.includes(w))) continue;
    const exact = String(t.number).toLowerCase() === q || terms.includes(String(t.number).toLowerCase());
    matches.push({ t, score: (exact ? 0 : 1) + (a.kind === "intercity" ? 0 : 0.5) });
  }
  matches.sort((x, y) => x.score - y.score || String(x.t.number).localeCompare(String(y.t.number), undefined, { numeric: true }));
  const stationHits = [];
  for (const st of state.stations.values()) {
    if (!st.agencies.some((id) => agencyShown(id) && agencyFiltered(id))) continue;
    const hay = fold(`${st.name} ${st.place} ${st.members.map((m) => `${m.name} ${m.lines.join(" ")} ${AGENCIES[m.agency].short}`).join(" ")}`);
    if (terms.every((w) => hay.includes(w))) stationHits.push(st);
  }
  stationHits.sort((a, b) => (b.major - a.major) || (b.members.length - a.members.length) || a.name.localeCompare(b.name));
  const stationHtml = stationHits.slice(0, 6).map((st) => `<button class="result" data-station="${esc(st.id)}">
      <span class="station-icon" style="--c:${AGENCIES[st.agencies[0]].color}"></span>
      <span><span class="title">${esc(st.name)}</span><br><span class="sub">${esc([st.place, stationLinesText(st)].filter(Boolean).join(" · "))}</span></span>
      <span></span>
    </button>`).join("");
  const stationBlock = stationHtml ? `<div class="group-title">${T("Stations")}</div>${stationHtml}` : "";

  // Railroads and lines, opening their pages.
  const has = (hay) => terms.every((w) => fold(hay).includes(w));
  const railroads = Object.entries(AGENCIES).filter(([id, a]) => agencyFiltered(id) && has(`${a.name} ${a.short} ${a.region}`))
    .sort((x, y) => (q ? 0 : byName(x[1].name, y[1].name)));
  const railroadBlock = railroads.length ? `<div class="group-title">${T("Railroads")}</div>` + railroads.slice(0, q ? 4 : 8).map(([id, a]) => {
    const n = [...state.trains.values()].filter((t) => t.agency === id).length;
    return `<button class="result" data-railroad="${id}">
      <span class="rr-icon" style="--c:${a.color}"></span>
      <span><span class="title">${esc(a.name)}</span><br><span class="sub">${esc(T(a.region))}</span></span>
      <span class="count">${T("{n} running", { n })} ›</span>
    </button>`;
  }).join("") : "";
  const lines = allLines().filter((l) => agencyFiltered(l.agency) && has(`${l.name} ${AGENCIES[l.agency].name} ${AGENCIES[l.agency].short}`))
    .sort((x, y) => Number(!fold(x.name).startsWith(q)) - Number(!fold(y.name).startsWith(q)) || y.running - x.running);
  const lineBlock = lines.length ? `<div class="group-title">${T("Lines")}</div>` + lines.slice(0, 6).map((l) => {
    const a = AGENCIES[l.agency];
    return `<button class="result" data-open-line="${esc(l.name)}" data-line-railroad="${l.agency}">
      <span class="line-icon">${lineMark(l.agency, l.name)}</span>
      <span><span class="title">${esc(l.name)}</span><br><span class="sub">${esc(a.short)}</span></span>
      <span class="count">${T("{n} running", { n: l.running })} ›</span>
    </button>`;
  }).join("") : "";
  // Cars, by number: the trains running with one now, where railroads list
  // their cars (the LIRR's, Metro-North's, the MBTA's, SEPTA's...).
  const carHits = [];
  if (/^[a-z0-9]{2,6}$/.test(q)) {
    for (const t of state.trains.values()) {
      if (!inLists(t) || !agencyFiltered(t.agency)) continue;
      const nums = (t.cars?.numbers || []).map((n) => String(n ?? "").toLowerCase());
      const i = nums.indexOf(q);
      if (i >= 0) carHits.push({ t, i, of: nums.length });
    }
  }
  const carBlock = carHits.length ? `<div class="group-title">${T("Cars")}</div>` + carHits.slice(0, 6).map(({ t, i, of }) => {
    const a = AGENCIES[t.agency], model = consistOf(t)?.cars[i]?.type?.name;
    const where = t.cars.complete && of > 1 ? T("car {n} of {of} from the front", { n: i + 1, of }) : "";
    return `<button class="result" data-car-train="${esc(t.id)}" data-car-i="${t.cars.complete ? i : ""}">
      ${plate(t.number || a.short, a.color, "sm")}
      <span><span class="title">${esc([T("Car {n}", { n: t.cars.numbers[i] }), model].filter(Boolean).join(" · "))}</span><br><span class="sub">${esc([t.destination ? T("to {place}", { place: t.destination }) : trainTitle(t), where].filter(Boolean).join(" · "))}</span></span>
      <span></span>
    </button>`;
  }).join("") : "";
  const route = routeQuery(state.query.trim());
  const routeBlock = route ? routeHtml(route) : "";
  const later = q.length >= 2 ? laterToday(terms, q) : [];
  laterShown = new Map(later.slice(0, 12).map((u) => [upcomingKey(u), u]));
  const laterBlock = later.length ? `<div class="group-title">${T("Later today")}</div>` + upcomingHtml(later.slice(0, 12)) +
    (later.length > 12 ? `<p class="results-more">${esc(T("{n} more later today", { n: later.length - 12 }))}</p>` : "") : "";
  const before = routeBlock + carBlock + railroadBlock + lineBlock + stationBlock;
  if (!matches.length) {
    setPane(el, before + laterBlock || `<div class="empty">${esc(q ? T("Nothing matches “{q}”.", { q: state.query.trim() }) : T("No trains running match these filters."))}</div>`);
    return;
  }
  setPane(el, before + (before ? `<div class="group-title">${T("Trains")}</div>` : "") + matches.slice(0, 60).map(({ t }) => {
    const a = AGENCIES[t.agency];
    const sub = [t.destination && T("to {place}", { place: t.destination }), t.nextStop && !t.destination && T("next {place}", { place: t.nextStop })]
      .filter(Boolean).join(" · ") || T(a.region);
    return `<div class="result-row"><button class="result" data-select="${esc(t.id)}">
      ${plate(t.number || a.short, a.color, "sm")}
      <span><span class="title">${esc(trainTitle(t))}</span><br><span class="sub">${esc(a.short)} · ${esc(sub)}</span></span>
      ${statusSpan(t, "status")}
    </button>${t.number ? addBtn(hasTrip(t.agency, t.number, localDay()), `data-add-train="${esc(t.id)}"`, `${a.short} ${t.number}`) : ""}</div>`;
  }).join("") + laterBlock);
}

// ---------- Later today: trains that haven't left yet ----------
// Every railroad's timetable for the next two weeks (data/schedules/, from
// scripts/build_schedules.py) and an index of its runs (data/departures.json,
// {railroad: {start, tz, unnumbered, stops: {id: name}, runs: [[number or run
// key, line, first stop, last stop, departure, days], ...]}}). Search lists
// the matching trains still to leave today (each railroad's own today), and
// a tap shows one's stops and times.
let departuresData = {}, departuresDataAsked = false; // and the regions' (addRegion)
let departuresLoaded = null; // settles once data/departures.json is in (or failed)
function departures() {
  if (!departuresDataAsked) {
    departuresDataAsked = true;
    departuresLoaded = fetch("data/departures.json?v=dev").then((r) => r.json()).then((d) => {
      departuresData = { ...decodeDepartures(d), ...departuresData };
      if (state.query) renderResults();
    }).catch((err) => console.warn("departures", err));
  }
  return departuresData;
}

// ---------- Planning a trip: the trains between two stations ----------
// From the timetables (data/schedules/, two weeks of each railroad's runs):
// the trains that call at one station and then the other on a day, for
// the trip form (js/account.js). A day past the timetable's two weeks is
// read as the same weekday in its second week: the timetable as it stands.
const schedulePromises = new Map(); // railroad -> Promise<timetable or null>
function loadSchedule(id) {
  if (!schedulePromises.has(id)) {
    departures();
    schedulePromises.set(id, Promise.all([departuresLoaded, needData(id)]).catch(() => {})
      .then(() => fetch(`data/${departures()[id]?.file || `schedules/${id}.json`}?v=dev`))
      .then((r) => (r.ok ? r.json() : null)).catch(() => null));
  }
  return schedulePromises.get(id);
}
// A day's runs in a railroad's timetable (runs(number), and every run with
// its number, all()): within the two weeks the file covers, from each run's
// days; after them, from the railroad's own calendar (tt.ahead, as far ahead
// as it publishes: a year for Amtrak), so a timetable change (a train that
// starts running in a month) is known; past that, or for a file without
// one, the same weekday's in the second week (exact: false).
function timetableDay(tt, day) {
  const [y, m, d] = tt.start.split("-").map(Number), [Y, M, D] = day.split("-").map(Number);
  const diff = Math.round((Date.UTC(Y, M - 1, D) - Date.UTC(y, m - 1, d)) / 86400000);
  const base = serviceStart(Date.UTC(Y, M - 1, D), tt.tz);
  const ahead = tt.ahead;
  let runs, exact = true, numbers = () => Object.keys(tt.trips || {});
  if (diff >= 0 && diff <= 13) {
    runs = (n) => (tt.trips[n] || []).filter(([days]) => days & (1 << diff));
  } else if (ahead && diff > 13 && day <= ahead.until) {
    const wd = (new Date(Date.UTC(Y, M - 1, D)).getUTCDay() + 6) % 7; // Monday first, as the calendar has it
    const on = new Set();
    ahead.services.forEach(([from, to, days, added, dropped], i) => {
      if (!dropped?.includes(day) && (added?.includes(day) || (from && day >= from && day <= to && (days >> wd) & 1))) on.add(i);
    });
    runs = (n) => (ahead.trips[n] || []).filter(([svcs]) => svcs.some((i) => on.has(i)))
      .map(([, run]) => (typeof run === "number" ? tt.trips[n][run] : [0, run[0], run[1]]));
    numbers = () => Object.keys(ahead.trips);
  } else {
    const idx = 7 + ((diff % 7) + 7) % 7;
    exact = false;
    runs = (n) => (tt.trips[n] || []).filter(([days]) => days & (1 << idx));
  }
  return { exact, base, runs, all: () => numbers().flatMap((n) => runs(n).map(([, line, stops]) => [n, line, stops])) };
}
const memberOf = (st, agency) => st?.members.filter((m) => m.agency === agency) || [];
async function findTrains(fromId, toId, day) {
  const from = state.stations.get(fromId), to = state.stations.get(toId);
  if (!from || !to || from === to) return { trains: [], exact: true };
  const shared = from.agencies.filter((a) => to.agencies.includes(a));
  const out = [];
  let exact = true;
  await Promise.all(shared.map(async (agency) => {
    const tt = await loadSchedule(agency);
    if (!tt?.trips) return;
    const a = memberOf(from, agency), b = memberOf(to, agency);
    const day_ = timetableDay(tt, day);
    if (!day_.exact) exact = false;
    // That day's runs that reach the first station before midnight, and the
    // day before's that reach it after (an overnight train).
    for (const [dd, before] of [[day_, 0], [timetableDay(tt, addDaysIso(day, -1)), 1]]) {
      for (const [key, line, stops] of dd.all()) {
        {
          const i = stops.findIndex(([sid]) => a.some((m) => m.id === sid));
          const j = i < 0 ? -1 : stops.findIndex(([sid], k) => k > i && b.some((m) => m.id === sid));
          if (j < 0) continue;
          const dep = stops[i][2] ?? stops[i][1], arr = stops[j][1] ?? stops[j][2];
          if (before ? dep < 1440 : dep >= 1440) continue;
          const base = dd.base;
          const ma = a.find((m) => m.id === stops[i][0]), mb = b.find((m) => m.id === stops[j][0]);
          out.push({
            agency, number: tt.unnumbered ? null : key, route: line || null,
            fromKey: ma.key, fromName: ma.name, toKey: mb.key, toName: mb.name,
            departAt: new Date(base + dep * 60000).toISOString(), arriveAt: new Date(base + arr * 60000).toISOString(),
            fromTz: ma.tz || from.tz || tt.tz, toTz: mb.tz || to.tz || tt.tz,
          });
        }
      }
    }
  }));
  const seen = new Set();
  return {
    exact,
    trains: out.sort((x, y) => x.departAt.localeCompare(y.departAt))
      .filter((r) => { const k = `${r.agency}|${r.number}|${r.departAt}`; return !seen.has(k) && seen.add(k); }),
  };
}
// One train's runs on a day, for the trip form's train number: [{ route,
// stops: [{ key, name, at, tz }] }].
async function trainRuns(agency, number, day) {
  const tt = number && (await loadSchedule(agency));
  if (!tt?.trips) return [];
  const d = timetableDay(tt, day);
  return d.runs(number).map(([, line, stops]) => ({
    route: line || null,
    stops: stops.map(([sid, arr, dep], i) => {
      const st = stationFor(agency, sid), m = st?.members.find((x) => x.agency === agency && x.id === sid);
      const min = i === stops.length - 1 ? arr ?? dep : dep ?? arr;
      return { key: m?.key || null, name: m?.name || tt.stops[sid]?.[0] || sid, at: new Date(d.base + min * 60000).toISOString(), tz: m?.tz || st?.tz || tt.tz };
    }),
  }));
}
// Stations by name or town, busiest first, for the trip form.
function searchStations(q, limit = 6) {
  const terms = fold(q.trim()).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const hits = [];
  for (const st of state.stations.values()) {
    const name = fold(st.name), hay = `${name} ${fold(st.place || "")} ${st.members.map((m) => fold(m.name)).join(" ")}`;
    if (!terms.every((w) => hay.includes(w))) continue;
    const trips = st.members.reduce((n, m) => n + (m.trips || 0), 0);
    hits.push({ st, score: (name.startsWith(terms[0]) ? 0 : 1) - Math.min(0.9, trips / 2000) - (st.major ? 0.3 : 0) });
  }
  return hits.sort((a, b) => a.score - b.score).slice(0, limit).map(({ st }) => stationChoice(st));
}
const stationChoice = (st) => ({ id: st.id, name: st.name, sub: [st.place !== st.name ? st.place : "", st.agencies.map((a) => AGENCIES[a]?.short).filter(Boolean).join(", ")].filter(Boolean).join(" · ") });
// The file keeps each railroad's runs as columns, with the line names and
// stop ids listed once and each departure as minutes after the run before
// (scripts/build_schedules.py); here they become a row per run again:
// [train number, line, first stop, last stop, departure, days].
function decodeDepartures(d) {
  for (const a of Object.values(d)) {
    const { lines, ids, runs: c } = a;
    let dep = 0;
    a.runs = c.key.map((key, i) => [key, lines[c.line[i]], ids[c.from[i]], ids[c.to[i]], (dep += c.dep[i]), c.days[i]]);
    delete a.lines;
    delete a.ids;
  }
  return d;
}
// A zone's date now, as that date's UTC midnight.
function zoneDay(tz, ms = Date.now()) {
  const p = Object.fromEntries(dateFormat({ timeZone: tz, year: "numeric", month: "numeric", day: "numeric" }, "en-US")
    .formatToParts(ms).map((x) => [x.type, x.value]));
  return Date.UTC(+p.year, p.month - 1, +p.day);
}
// The moment a service day starts in a zone (day: its date's UTC midnight).
const serviceStart = (day, tz) => day - zoneOffset(day + 12 * 3600000, tz) * 60000;

function laterToday(terms, q) {
  const all = departures(), now = Date.now(), out = [];
  const running = new Set([...state.trains.values()].filter((t) => t.number).map((t) => `${t.agency}|${t.number}`));
  for (const [id, d] of Object.entries(all)) {
    const a = AGENCIES[id];
    if (!a || !agencyShown(id) || !agencyFiltered(id) || !d.runs) continue;
    const [y, m, day] = d.start.split("-").map(Number), today = zoneDay(d.tz);
    const first = Math.round((today - Date.UTC(y, m - 1, day)) / 86400000);
    // Today's service day, and yesterday's trains still to leave after midnight.
    for (const idx of [first, first - 1]) {
      if (idx < 0 || idx > 13) continue;
      const start = serviceStart(today - (first - idx) * 86400000, d.tz);
      for (const [key, line, from, to, dep, days] of d.runs) {
        if (!(days & (1 << idx)) || (idx < first && dep < 1440)) continue;
        const at = start + dep * 60000;
        const number = d.unnumbered ? null : key;
        if (at <= now || (number && running.has(`${id}|${number}`))) continue;
        const origin = d.stops[from] || "", dest = d.stops[to] || "";
        const hay = fold(`${a.name} ${a.short} ${a.region} ${number || ""} ${line} ${origin} ${dest}`);
        if (!terms.every((w) => hay.includes(w))) continue;
        const exact = Boolean(number) && (String(number).toLowerCase() === q || terms.includes(String(number).toLowerCase()));
        out.push({ id, key, number, line, origin, dest, at, dep, idx, start, tz: d.tz, exact });
      }
    }
  }
  return out.sort((x, y) => Number(y.exact) - Number(x.exact) || x.at - y.at);
}

const upcomingKey = (u) => `${u.id}|${u.key}|${u.idx}|${u.dep}`;
function upcomingHtml(list) {
  return list.map((u) => {
    const a = AGENCIES[u.id], k = upcomingKey(u), open = state.upcomingOpen === k;
    const leaves = T("leaves {place} at {time}", { place: u.origin, time: fmtTime(new Date(u.at).toISOString(), u.tz) });
    return `<div class="result-row"><button type="button" class="result upcoming" data-upcoming="${esc(k)}" aria-expanded="${open}">
      ${plate(u.number || a.short, a.color, "sm")}
      <span><span class="title">${esc(u.dest ? T("{line} to {place}", { line: u.line, place: u.dest }) : u.line)}</span><br><span class="sub">${esc(a.short)} · ${esc(leaves)}</span></span>
      <span class="status neutral">${esc(u.at - Date.now() < 30000 ? T("now") : T("in {time}", { time: fmtIn(u.at) }))}</span>
    </button>${u.number ? addBtn(hasTrip(u.id, u.number, localDay(u.at, u.tz)), `data-add-later="${esc(k)}"`, `${a.short} ${u.number}`) : ""}</div>${open ? upcomingStops(u) : ""}`;
  }).join("");
}

// A railroad's whole timetable, loaded when one of its trains is opened.
const scheduleCache = {};
function scheduleOf(id) {
  if (!scheduleCache[id]) {
    scheduleCache[id] = { loading: true };
    fetch(`data/${departures()[id]?.file || `schedules/${id}.json`}?v=dev`).then((r) => r.json()).then((d) => {
      scheduleCache[id] = d;
      if (state.query) renderResults();
    }).catch((err) => {
      scheduleCache[id] = { failed: true };
      console.warn("schedule", id, err);
    });
  }
  return scheduleCache[id];
}
// A station on the map for one of a railroad's stops.
// A station by one of its railroads' ids for it, from an index over every
// station's members made the first time it's needed (the station list is
// loaded once; should it be replaced, the index is made again).
let stationIndex = null, stationIndexOf = null;
function stationFor(agency, sid) {
  if (stationIndexOf !== state.stations || stationIndex.size === 0 && state.stations.size) {
    stationIndex = new Map();
    // The first station listing a member keeps it, as the scan this replaces did.
    for (const st of state.stations.values()) for (const m of st.members) if (!stationIndex.has(`${m.agency}|${m.id}`)) stationIndex.set(`${m.agency}|${m.id}`, st);
    stationIndexOf = state.stations;
  }
  return stationIndex.get(`${agency}|${sid}`) || null;
}
function upcomingStops(u) {
  const tt = scheduleOf(u.id), a = AGENCIES[u.id];
  if (tt.loading) return `<p class="upcoming-note">${esc(T("Loading its stops…"))}</p>`;
  const run = (tt.trips?.[u.key] || []).find(([days, , stops]) => days & (1 << u.idx) && stops[0]?.[2] === u.dep);
  if (!run) return `<p class="upcoming-note">${esc(T("Its stops aren't available."))}</p>`;
  const stops = run[2];
  return `<ol class="stops line-stops upcoming-stops" style="--line-color:${lineColorOf(u.id, run[1]) || a.color}">${stops.map(([sid, arr, dep], i) => {
    const st = stationFor(u.id, sid), name = tt.stops[sid]?.[0] || st?.name || sid;
    const min = i === stops.length - 1 ? arr ?? dep : dep ?? arr;
    const time = fmtTime(new Date(u.start + min * 60000).toISOString(), st?.members.find((m) => m.agency === u.id)?.tz || u.tz);
    return `<li${st ? ` class="link" data-station="${esc(st.id)}" role="button" tabindex="0"` : ""}><span class="stop-dot" aria-hidden="true"></span><span>${esc(name)}</span><span class="time">${esc(time)}</span></li>`;
  }).join("")}</ol>`;
}

// ---------- Rendering: train detail ----------

// 6:05 PM, or 18:05 with the 24-hour clock.
const clockOptions = () => (state.clock24 ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" } : { hour: "numeric", minute: "2-digit" });
// A time in the zone chosen in Settings (tz: the stop's own zone, used when
// that's the choice).
function fmtTime(iso, tz) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(+d)) return "";
  const zone = state.timeZone === "station" ? tz : state.timeZone;
  try {
    return dateFormat({ ...clockOptions(), timeZone: zone || undefined }).format(d);
  } catch {
    return dateFormat(clockOptions()).format(d);
  }
}

function fmtAgo(ms) {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return T("{n}s ago", { n: s });
  if (s < 3600) return T("{n} min ago", { n: Math.round(s / 60) });
  return T("{n} h ago", { n: Math.round(s / 3600) });
}


const KM_PER_MI = 1.609344;
// A railroad's speeds and sizes in its own country's units (km/h in
// Finland) until the viewer picks units; in the US and Canada, and the
// countries still on miles, the viewer's.
const VIEWER_UNITS = new Set(["US", "CA", "GB", "LR", "MM"]);
const unitsOf = (agency) => (store.get("tt-units", null) == null && !VIEWER_UNITS.has(AGENCIES[agency]?.country || "US") ? "km" : state.units);

// ---------- Crowding ----------
// How full a train is, car by car: NJ Transit's (its Rail Data API) and the
// LIRR's and Metro-North's (their TrainTime app's data), through the relay.
// Read when the train is opened, then every minute while it stays open.
// Each car: { no, level (0 nearly empty .. 3 standing room), pct?, color?,
// rest, quiet }, front first.

const CROWD_LEVELS = ["Nearly empty", "Plenty of seats", "Few seats left", "Standing room only"];
const CROWD_COLORS = ["var(--good)", "var(--good)", "var(--warn)", "var(--bad)"];
const MTA_LEVEL = { EMPTY: 0, MANY_SEATS: 1, FEW_SEATS: 2, SRO: 3 };
const levelOfPct = (pct) => (pct == null ? null : pct < 10 ? 0 : pct < 40 ? 1 : pct < 75 ? 2 : 3);

function crowdFrom(agency, d) {
  const c = d?.crowd;
  if (!c) return null;
  if (agency === "njt") {
    const cars = (c.sections || []).flatMap((x) => x.cars).filter((k) => k.position != null).sort((x, y) => x.position - y.position)
      .map((k) => ({ no: k.no, level: levelOfPct(k.pct), pct: k.pct, color: k.color, rest: k.rest, quiet: false }));
    return { level: levelOfPct(c.pct), at: c.at || d.at, cars };
  }
  const cars = c.cars.filter((k) => !k.loco).map((k) => ({ no: k.no, level: MTA_LEVEL[k.level] ?? null, rest: k.rest, quiet: k.quiet }));
  const known = cars.filter((k) => k.level != null);
  if (!known.length) return null;
  // (No time: TrainTime doesn't say when its counts were taken.)
  return { level: Math.round(known.reduce((n, k) => n + k.level, 0) / known.length), at: null, cars };
}

function loadCrowd(t) {
  const url = !RELAY || !t.number ? null
    : t.agency === "njt" ? `/njt-crowd/${encodeURIComponent(t.number)}`
    : t.agency === "lirr" || t.agency === "mnr" ? `/mta-crowd/${t.agency}/${encodeURIComponent(t.number)}` : null;
  if (!url) return;
  const c = state.crowd;
  if (c?.id === t.id && Date.now() - c.at < 60 * 1000) return;
  state.crowd = { id: t.id, at: Date.now(), data: c?.id === t.id ? c.data : null };
  fetch(`${RELAY.replace(/\/$/, "")}${url}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (state.crowd?.id !== t.id) return;
      state.crowd.data = crowdFrom(t.agency, d);
      if (state.selected === t.id) renderDetail();
    })
    .catch(() => {});
}

const RESTROOM_ICON = '<svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><path fill="currentColor" d="M7 2.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm10 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM5 8h4l1.5 7H9v6.5H5V15H3.5zm10 0h4v7h-1v6.5h-2V15h-1z"/></svg>';
const QUIET_ICON = '<svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><path fill="currentColor" d="M4 9h4l5-4v14l-5-4H4zM16.3 9.3l1.4-1.4L20 10.2l2.3-2.3 1.4 1.4-2.3 2.3 2.3 2.3-1.4 1.4-2.3-2.3-2.3 2.3-1.4-1.4 2.3-2.3z"/></svg>';
function crowdSection(t) {
  const c = state.crowd?.id === t.id && state.crowd.data;
  if (!c || c.level == null) return "";
  const cars = c.cars || [];
  return `<section class="crowd" aria-label="${T("How full")}">
    <div class="crowd-head"><span class="crowd-dot" style="--c:${CROWD_COLORS[c.level]}"></span><strong>${T(CROWD_LEVELS[c.level])}</strong>
      ${c.at ? `<span class="crowd-sub">${esc(fmtAgo(c.at))}</span>` : ""}</div>
    ${cars.length ? `<div class="crowd-cars">${cars.map((k) => {
      const h = k.level == null ? 0 : Math.max(6, Math.min(100, k.pct ?? [8, 35, 70, 100][k.level]));
      const what = k.level == null ? T("no count") : k.pct != null ? T("{pct}% full", { pct: k.pct }) : T(CROWD_LEVELS[k.level]);
      return `<div class="cc${k.level == null ? " none" : ""}" title="${esc(`${k.no ? T("Car {n}", { n: k.no }) : ""}: ${what}${k.quiet ? ` · ${T("Quiet car")}` : ""}`)}">
        <span class="cc-fill" style="height:${h}%;background:${esc(k.color || CROWD_COLORS[k.level] || "transparent")}"></span>
        <span class="cc-icons">${k.rest ? RESTROOM_ICON : ""}${k.quiet ? QUIET_ICON : ""}</span></div>`;
    }).join("")}</div>
      <div class="crowd-ends"><span>${T("Front")}</span><span>${T("Rear")}</span></div>` : ""}
  </section>`;
}

// ---------- Service notices ----------

const NOTICE_REFRESH_MS = 2 * 60 * 1000;

function loadNotices(t) {
  const n = state.notices;
  if (n.id === t.id && Date.now() - n.at < NOTICE_REFRESH_MS) return;
  state.notices = { id: t.id, list: n.id === t.id ? n.list : [], at: Date.now() };
  trainNotices(t)
    .then((list) => {
      if (state.notices.id !== t.id) return;
      state.notices.list = list;
      if (state.selected === t.id) renderDetail();
    })
    .catch((err) => console.warn("notices", err));
}

function noticesHtml(t) {
  return noticesBlock(state.notices.id === t.id ? state.notices.list : [], t.route);
}
// A foldable list of notices (folded or not as the viewer last left it).
function noticesBlock(list, route = null, title = T("Service notices")) {
  if (!list.length) return "";
  const open = !state.noticesCollapsed;
  return `<div class="notices${open ? "" : " collapsed"}">
    <h3 class="section-title"><button type="button" class="notices-toggle" data-notices-toggle aria-expanded="${open}">
      ${esc(title)} <span class="notices-count">${list.length}</span>
      <svg class="chev" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button></h3>
    ${open ? list.map((n) => `<div class="notice">
      <span class="notice-icon" aria-hidden="true">!</span>
      <div class="notice-body">
        <p class="notice-head">${esc(n.header)}</p>
        ${n.description && n.description !== n.header
          ? `<details><summary>${T("More")}</summary><p>${esc(n.description).replace(/\n+/g, "<br>")}</p></details>` : ""}
        ${n.url ? `<a href="${esc(n.url)}" target="_blank" rel="noopener">${T("Details")}</a>` : ""}
        ${n.scope === "line" && route ? `<span class="notice-scope">${esc(route)}</span>` : ""}
      </div>
    </div>`).join("") : ""}
  </div>`;
}

const stripScroll = new Map();
// A press in the panel holds off feed redraws until it's released: replacing
// the row under the pointer between press and release loses the tap.
let pressing = false, redrawAfterPress = false;
on("train-detail", "pointerdown", () => { pressing = true; });
for (const type of ["pointerup", "pointercancel"]) {
  document.addEventListener(type, () => {
    if (!pressing) return;
    pressing = false;
    // After the click this release makes has been handled.
    if (redrawAfterPress) setTimeout(() => { redrawAfterPress = false; renderDetail(); });
  });
}

function renderDetail() {
  if (pressing) { redrawAfterPress = true; return; }
  if (state.railroad) return renderRailroad();
  if (state.station) return renderStation();
  const t = state.trains.get(state.selected);
  const el = $("train-detail");
  if (!t) {
    el.innerHTML = `<p class="empty">${T("This train isn’t reporting right now. It may have finished its trip.")}</p>`;
    return;
  }
  // How far the cars strip is scrolled, kept per train across re-renders
  // and a visit to a car's model page.
  const shown = el.querySelector(".consist-strip");
  if (shown && el.dataset.train) stripScroll.set(el.dataset.train, shown.scrollLeft);
  if (state.car?.page && state.car.id === t.id) return renderModelPage(t, el);
  loadNotices(t);
  loadCrowd(t);
  loadHistory(t);
  const a = AGENCIES[t.agency];
  const lineColor = t.routeColor || a.color;
  const tiles = factTiles(t);
  // A tracked train: the rest of the ride, from the station it's at (or the
  // last it left) to the stop being tracked to, is drawn in the line's color;
  // the stops before and after are greyed out.
  const rec = state.tracked.find((r) => r.id === t.id);
  const ahead = t.stops?.findIndex((s) => s.status !== "past") ?? -1;
  const indexOf = (key) => (key ? t.stops?.findIndex((s) => s.key === key) ?? -1 : -1);
  const dest = !rec || !t.stops ? -1 : rec.stopKey ? indexOf(rec.stopKey) : t.stops.length - 1;
  const at = ahead >= 0 && t.stops[ahead].here;
  const from = at ? ahead : ahead - 1;
  const leg = (i) => dest < 0 ? ""
    : i === dest ? " dest" : i > dest ? " beyond" : i === from ? " ride-from" : i < from ? " before" : " ride";
  const likely = likelyDelays(t);
  // The stops it has passed fold into one row, but for the last of them, so
  // the page opens on where it is and what's ahead; the row unfolds them.
  const passed = ahead < 0 ? (t.stops?.length || 0) : ahead;
  const fold = !pastOpen.has(t.id) && passed > 2 ? passed - 1 : 0;
  const foldRow = fold ? `<li class="past fold" data-fold-past role="button" tabindex="0"><span class="stop-dot" aria-hidden="true"></span><span>${esc(Tn(fold, "{n} earlier stop", "{n} earlier stops"))}</span><span class="time" aria-hidden="true">›</span></li>` : "";
  const stops = t.stops?.length
    ? rrSection("stops", T("Stops"), t.stops.length, `<div class="stops-scroll"><ol class="stops" style="--line-color:${lineColor}">${foldRow}${t.stops.map((s, i) => {
        if (i < fold) return "";
        // Late by five minutes or more: the new time, with the timetable's
        // beside it, smaller and struck through.
        const lateMin = s.scheduled && s.time ? Math.round((Date.parse(s.time) - Date.parse(s.scheduled)) / 60000) : 0;
        const time = lateMin >= LATE_MIN
          ? `<span class="late">${fmtTime(s.time, s.tz)}</span><s class="was" aria-label="${esc(T("scheduled {time}", { time: fmtTime(s.scheduled, s.tz) }))}">${fmtTime(s.scheduled, s.tz)}</s>`
          : fmtTime(s.time, s.tz);
        // Each stop opens its station's page ("back" returns to this train).
        const sid = s.key && state.stationOfKey?.get(s.key);
        const link = sid ? ` data-stop-station="${esc(sid)}" role="button" tabindex="0" title="${esc(T("{name} station", { name: s.name }))}"` : "";
        const guess = likely?.get(s.key);
        const name = guess ? `${esc(s.name)}<small class="likely ${lateText(guess.min).cls}">${esc(likelyText(guess.min))}</small>` : esc(s.name);
        return `<li class="${s.status}${s.here ? " here" : ""}${leg(i)}${sid ? " link" : ""}"${link}><span class="stop-dot" aria-hidden="true"></span><span>${name}</span><span class="time">${time}</span></li>`;
      }).join("")}</ol></div>`)
    : "";
  // Re-rendering replaces the content; keep the reader where they were in
  // the panel, the cars strip and the stop list (same train only).
  const same = el.dataset.train === t.id;
  const keepScroll = el.scrollTop;
  const keepStops = same ? el.querySelector(".stops-scroll")?.scrollTop || 0 : 0;
  el.dataset.train = t.id;
  const hero = `<div class="hero">
      <button type="button" class="agency-name hero-link" data-railroad="${t.agency}" style="color:${a.color}"><span class="dot" style="background:${a.color}"></span>${esc(a.name)}</button>
      <div class="hero-title">${t.number ? plate(t.number, a.color) : ""}<h2>${t.route && !singleLine(t.agency)
        // The title is the train's line: it opens the line's page (or, with
        // no line or just the one, the railroad's).
        ? `<button type="button" class="hero-link" data-open-line="${esc(t.route)}" data-line-railroad="${t.agency}" style="--hc:${t.routeColor || a.color}">${escTitle(trainTitle(t))}<span class="hero-go" aria-hidden="true">›</span></button>`
        : `<button type="button" class="hero-link" data-railroad="${t.agency}" style="--hc:${a.color}">${escTitle(trainTitle(t))}<span class="hero-go" aria-hidden="true">›</span></button>`}</h2></div>
      ${t.destination ? `<p class="od">${t.origin ? `${esc(t.origin)}<span class="arrow">→</span>` : `${T("to")} `}<strong>${esc(t.destination)}</strong></p>` : ""}
      <div class="hero-actions">
        ${statusSpan(t, "pill")}
        ${trackButton(t)}
      </div>
      ${consistSection(t)}
    </div>`;
  const opened = pageKeys.get(el) !== `train:${t.id}`;
  renderParts(el, `train:${t.id}`, [hero, tiles, crowdSection(t), noticesHtml(t), stops, onBoardFor(t), historySection(t)]);
  if (opened) flipPlate(el.querySelector(".hero-title .plate > span"));
  el.scrollTop = keepScroll;
  const strip = el.querySelector(".consist-strip"), list = el.querySelector(".stops-scroll");
  if (strip) strip.scrollLeft = stripScroll.get(t.id) || 0;
  if (list) list.scrollTop = keepStops;
}

// The train's number flips into its plate character by character, like a
// station's split-flap board, as its page opens (not when it's drawn again).
function flipPlate(el) {
  if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  el.innerHTML = [...el.textContent].map((ch, i) => `<span class="flap" style="--c:${i}">${esc(ch)}</span>`).join("");
}

// A wifi-style signal mark beside the time of the train's last GPS report.
const SIGNAL_ICON = `<svg viewBox="0 0 16 16" width="13" height="13" aria-label="GPS"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M1.8 6.2a9 9 0 0 1 12.4 0"/><path d="M4.1 8.7a5.6 5.6 0 0 1 7.8 0"/></g><circle cx="8" cy="11.6" r="1.4" fill="currentColor"/></svg>`;

const CLOSE_ICON = `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;

const INFERRED_TITLE = T("Worked out by Trainsheet from GPS; not yet reported by the railroad");

// An id token from a train's or a type's id, for the ids in its drawing.
const idToken = (s) => String(s).replace(/[^A-Za-z0-9]/g, "x");

// The train's cars, drawn right under its status: live where the railroad
// reports them, otherwise what typically runs on the route. Tapping a car
// opens a card about its model under the drawing; the card leads to the
// model's full page. The drawing's ids come from the train's, so the same
// train drawn again gives the same markup (and the page keeps the drawing).
function consistSection(t) {
  const c = consistOf(t);
  if (!c) return "";
  const a = AGENCIES[t.agency];
  const open = state.car?.id === t.id ? state.car.i : null;
  let strip = consistHtml(c, a.color, `tsc_${idToken(t.id)}`);
  if (open != null) strip = strip.replace(`data-car="${open}" `, `data-car="${open}" aria-pressed="true" `);
  return `<div class="consist">
    <div class="consist-strip${open != null ? " has-open" : ""}">${strip}</div>
    ${open != null ? modelCard(t, c, open) : ""}</div>`;
}

// What a train has on board, read from its cars: a dining car, a café,
// sleepers, a lounge with big windows, business class, cars carried along.
const AMENITY_ICON = {
  dining: '<path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v5m4-5v5M17 21V3c-2 1-3 3.5-3 7 0 1.7.9 3 3 3"/>',
  cafe: '<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3v3m4-3v3"/>',
  sleepers: '<path d="M3 19V6m0 9h18v4m0-4v-3a3 3 0 0 0-3-3h-7v6M7 12.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/>',
  lounge: '<path d="M3 20h18M5 20l5-9 3 5 2-3 4 7M15 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>',
  first: '<path d="M12 3.5l2.5 5.2 5.7.8-4.1 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4.1-4 5.7-.8z"/>',
  business: '<path d="M4 8h16v11H4zM9 8V5h6v3M4 13h16"/>',
  autos: '<path d="M5 16l1.5-5h11l1.5 5M4 16h16v3H4zM7 19v1.5M17 19v1.5M7.5 16h.01M16.5 16h.01"/>',
};
const AMENITIES = [
  ["dining", "Dining car", ["superlinerDiner", "viewlinerDiner", "buddDiner", "renaissanceDiner"]],
  // Every Acela has a café car (its cars are drawn as one type).
  ["cafe", "Café", ["amfleetCafe", "superlinerLounge", "skyline", "acelaCoach"]],
  ["sleepers", "Sleeping cars", ["superlinerSleeper", "viewlinerSleeper", "buddSleeper", "renaissanceSleeper"]],
  ["lounge", "Lounge with a view", ["superlinerLounge", "skyline", "parkCar"]],
  ["first", "First class", ["acelaCoach"]],
  ["business", "Business class", ["amfleetBusiness", "acelaCoach"]],
  ["autos", "Your car rides along", ["autorack"]],
];
const onBoardFor = (t) => { const c = consistOf(t); return c ? onBoard(c) : ""; };
function onBoard(c) {
  const keys = new Set(c.cars.map((car) => car.type?.key).filter(Boolean));
  // A plug-in's types list theirs ({ amenities: ["dining", ...] }, consist.js).
  const own = new Set(c.cars.flatMap((car) => car.type?.amenities || []));
  const has = AMENITIES.filter(([id, , types]) => own.has(id) || types.some((k) => keys.has(k)));
  if (!has.length) return "";
  const title = T(c.typical ? "Usually on board" : "On board");
  return `<section class="on-board" aria-label="${title}">
    <h3 class="on-board-title">${title}</h3>
    <ul class="chips">${has.map(([id, label]) => `<li class="amenity"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${AMENITY_ICON[id]}</svg><span>${T(label)}</span></li>`).join("")}</ul>
  </section>`;
}

// ---------- Track record ----------
// How late this train number has reached its last stop lately: the relay
// records every Amtrak, VIA and Brightline trip as it finishes (relay/worker.js,
// GET /history). Shown once a few trips are in.

const HISTORY_RR = new Set(["amtrak", "via", "brightline"]);
const historyCache = new Map(); // "agency:number" -> { at, runs }
function loadHistory(t) {
  if (!RELAY || !HISTORY_RR.has(t.agency) || !t.number) return;
  const k = `${t.agency}:${t.number}`, hit = historyCache.get(k);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return;
  historyCache.set(k, { at: Date.now(), runs: hit?.runs || null });
  fetch(`${RELAY.replace(/\/$/, "")}/history/${t.agency}/${encodeURIComponent(t.number)}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (!d?.runs) return;
      historyCache.set(k, { at: Date.now(), runs: d.runs });
      if (state.selected === t.id) renderDetail();
    })
    .catch(() => {});
}

// ---------- Likely delays ----------
// How late an Amtrak, VIA or Brightline train has been at each of its stops
// over the last eight weeks (the relay's Delays by stop), and from that how
// late it's likely to be at the stops still ahead: past trips of the same
// train that were about as late as it is now at the stop it last left, and
// how much later (or less late) they got from there. Before it leaves, how
// late it usually is.
const delaysCache = new Map(); // "agency:number" -> { at, data }
const DELAY_MIN_TRIPS = 4;     // fewer past trips than this: no guess
function loadDelays(agency, number) {
  if (!RELAY || !HISTORY_RR.has(agency) || !number) return null;
  const k = `${agency}:${number}`, hit = delaysCache.get(k);
  if (hit && Date.now() - hit.at < 30 * 60 * 1000) return hit.data;
  delaysCache.set(k, { at: Date.now(), data: hit?.data || null });
  fetch(`${RELAY.replace(/\/$/, "")}/delays/${agency}/${encodeURIComponent(number)}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (!d?.stops) return;
      delaysCache.set(k, { at: Date.now(), data: { days: d.days, stops: new Map(d.stops.map((x) => [`ic:${x.code}`, x.d])) } });
      renderTracked();
      if (!state.query.trim() && !filtersOn()) renderAgencies();
      const sel = state.trains.get(state.selected);
      if (sel?.agency === agency && String(sel.number) === String(number)) renderDetail();
    })
    .catch(() => {});
  return hit?.data || null;
}
// The middle of weighted values: [[value, weight]].
function weightedMedian(pairs) {
  const list = pairs.slice().sort((a, b) => a[0] - b[0]);
  const half = list.reduce((n, p) => n + p[1], 0) / 2;
  let run = 0;
  for (const [v, w] of list) if ((run += w) >= half) return v;
  return list[list.length - 1]?.[0] ?? null;
}
// How late it was at a stop, where it has left it: against its departure at
// its first stop, its arrival at the rest.
function delayAt(t, i) {
  const s = t.stops[i];
  const [at, sch] = i === 0 ? [s.dep, s.schDep] : [s.arr, s.schArr];
  const d = at && sch ? Math.round((Date.parse(at) - Date.parse(sch)) / 60000) : null;
  return Number.isFinite(d) ? d : null;
}
// { key -> { min, n } } for the stops still ahead: minutes late, likely, and
// from how many past trips.
function likelyDelays(t) {
  const data = t.stops?.length && loadDelays(t.agency, t.number);
  if (!data) return null;
  const past = t.stops.map((s, i) => (s.status === "past" ? i : -1)).filter((i) => i >= 0);
  const anchor = past.length ? past[past.length - 1] : null;
  const now = anchor != null ? delayAt(t, anchor) : null;
  const before = anchor != null && now != null ? data.stops.get(t.stops[anchor].key) : null;
  const out = new Map();
  t.stops.forEach((s, j) => {
    if (s.status === "past") return;
    const hist = data.stops.get(s.key);
    if (!hist) return;
    if (before) {
      // Trips about as late as this one weigh most.
      const pairs = [];
      hist.forEach((d, k) => { if (d != null && before[k] != null) pairs.push([d - before[k], 1 / (1 + Math.abs(before[k] - now) / 10)]); });
      if (pairs.length >= DELAY_MIN_TRIPS) out.set(s.key, { min: Math.round(now + weightedMedian(pairs)), n: pairs.length });
    } else {
      const vals = hist.filter((d) => d != null);
      if (vals.length >= DELAY_MIN_TRIPS) out.set(s.key, { min: Math.round(weightedMedian(vals.map((v) => [v, 1]))), n: vals.length, usual: true });
    }
  });
  return out;
}
// How late a train number usually is at a stop: { median, within, n }.
function usualDelay(agency, number, key) {
  const vals = loadDelays(agency, number)?.stops.get(key)?.filter((d) => d != null);
  if (!vals || vals.length < DELAY_MIN_TRIPS) return null;
  return { median: Math.round(weightedMedian(vals.map((v) => [v, 1]))), within: vals.filter((d) => d <= ON_TIME_MIN).length, n: vals.length };
}
const likelyText = (min) => (lateText(min).cls === "good" ? T("likely on time") : T("likely {late}", { late: lateText(min).text.toLowerCase() }));
const usualText = (u) => `${lateText(u.median).cls === "good" ? T("Usually on time") : T("Usually {late}", { late: lateText(u.median).text.toLowerCase() })} · ${T("within {n} min on {k} of {m} trips", { n: ON_TIME_MIN, k: u.within, m: u.n })}`;
// The stop a train's guess is about: the one it's tracked to, else its last.
const guessStop = (t) => {
  const rec = state.tracked.find((r) => r.id === t.id);
  return (rec?.stopKey && t.stops?.find((s) => s.key === rec.stopKey)) || t.stops?.[t.stops.length - 1] || null;
};
function likelyLine(t) {
  const stop = guessStop(t), guess = stop && likelyDelays(t)?.get(stop.key);
  if (!guess) return "";
  const text = guess.usual ? usualText(usualDelay(t.agency, t.number, stop.key)) : `${likelyText(guess.min)}`;
  return `<p class="likely-note"><span class="likely ${lateText(guess.min).cls}">${esc(guess.usual ? text : text.charAt(0).toUpperCase() + text.slice(1))}</span> ${esc(T("at {place}", { place: stop.name }))}${guess.usual ? "" : ` · ${esc(T("from {n} past trips", { n: guess.n }))}`}</p>`;
}

const HISTORY_DAYS = 14;
const ON_TIME_MIN = 10;
function historySection(t) {
  const runs = historyCache.get(`${t.agency}:${t.number}`)?.runs;
  if (!runs || runs.length < 3) return "";
  const list = runs.slice(0, HISTORY_DAYS).reverse(); // oldest first
  const late = list.map((r) => Math.max(0, r.delay)).sort((a, b) => a - b);
  const median = late.length % 2 ? late[(late.length - 1) / 2] : Math.round((late[late.length / 2 - 1] + late[late.length / 2]) / 2);
  const worst = list.reduce((w, r) => (r.delay > w.delay ? r : w), list[0]);
  const onTime = list.filter((r) => r.delay <= ON_TIME_MIN).length;
  const dayLabel = (day) => dateFormat({ month: "short", day: "numeric" }).format(new Date(`${day}T12:00:00`));
  // Bars to one scale (at least an hour tall, so a quiet fortnight looks quiet).
  const W = 300, H = 92, top = 8, base = 72, max = Math.max(60, ...late);
  const y = (min) => base - ((base - top) * Math.min(min, max)) / max;
  const slot = W / list.length, bw = Math.max(4, Math.min(16, slot * 0.66));
  const color = (d) => `var(--${d <= ON_TIME_MIN ? "good" : d <= 30 ? "warn" : "bad"})`;
  const bars = list.map((r, i) => {
    const d = Math.max(0, r.delay), h = Math.max(1.5, base - y(d));
    return `<rect x="${(i * slot + (slot - bw) / 2).toFixed(1)}" y="${(base - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="1.5" fill="${color(d)}"><title>${esc(`${dayLabel(r.day)}: ${lateText(r.delay).text}`)}</title></rect>`;
  }).join("");
  const svg = `<svg class="history-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(T("How late it reached {place} on each of the last {n} trips", { place: list[list.length - 1].dest, n: list.length }))}">
    <line x1="0" x2="${W}" y1="${y(ON_TIME_MIN).toFixed(1)}" y2="${y(ON_TIME_MIN).toFixed(1)}" class="hc-mark"/>
    <text x="${W}" y="${(y(ON_TIME_MIN) - 3).toFixed(1)}" text-anchor="end" class="hc-label">${esc(T("{n} min", { n: ON_TIME_MIN }))}</text>
    <line x1="0" x2="${W}" y1="${base}" y2="${base}" class="hc-base"/>
    ${bars}
    <text x="0" y="${H - 4}" class="hc-label">${esc(dayLabel(list[0].day))}</text>
    <text x="${W}" y="${H - 4}" text-anchor="end" class="hc-label">${esc(dayLabel(list[list.length - 1].day))}</text>
  </svg>`;
  const tiles = `<div class="rr-stats">
    ${statTile(`${onTime}/${list.length}`, T("within {n} min", { n: ON_TIME_MIN }), onTime >= list.length * 0.8 ? "good" : "warn")}
    ${statTile(median, T("median min late"))}
    ${statTile(Math.max(0, worst.delay), T("worst, {day}", { day: dayLabel(worst.day) }), worst.delay > 30 ? "bad" : worst.delay > ON_TIME_MIN ? "warn" : "good")}
  </div>`;
  return rrSection("history", T("Track record"), null, `${tiles}${svg}
    <p class="estimate-note">${esc(T("How late it reached {place} on its last {n} trips, as recorded by Trainsheet.", { place: list[list.length - 1].dest, n: list.length }))}</p>`);
}

// ---------- Train models ----------

// Fact sheets for each model (data/models.json), loaded on first use.
let modelsData = null;
function models() {
  if (!modelsData) {
    modelsData = {};
    fetch("data/models.json?v=dev").then((r) => r.json()).then((d) => {
      modelsData = d;
      if (state.car || state.railroad) renderDetail();
    }).catch((err) => console.warn("models", err));
  }
  return modelsData;
}
function modelOf(c, i) {
  const all = models();
  return modelIds(c, i).map((id) => all[id] || pluginFacts(id)).find(Boolean) || null;
}
// A plug-in railroad's cars come in their own file (consist.js): once in,
// the train or railroad showing redraws with them.
onCars(() => {
  if (state.selected || state.railroad) renderDetail();
  if (state.tab === "history") renderAgencies(); // the train ridden most, drawn
});

const factText = {
  topSpeedMph: (v, units) => (units === "km" ? `${Math.round(v * KM_PER_MI)} km/h` : `${v} ${T("mph")}`),
  powerHp: (v, units) => (units === "km" ? `${Math.round(v * 0.7457).toLocaleString(locale)} kW` : `${v.toLocaleString(locale)} ${T("hp")}`),
  seats: (v) => `${v}`,
  lengthFt: (v, units) => (units === "km" ? `${(v * 0.3048).toFixed(1)} m` : `${Math.round(v)} ${T("ft")}`),
};
const FACT_LABELS = { built: "Built", fleet: "Fleet", topSpeedMph: "Top speed", powerHp: "Power", seats: "Seats", lengthFt: "Length" };
function facts(m, keys, units = state.units) {
  return keys.filter((k) => m[k] != null && m[k] !== "")
    .map((k) => `<div><dt>${T(FACT_LABELS[k])}</dt><dd>${esc(factText[k] ? factText[k](m[k], units) : m[k])}</dd></div>`).join("");
}

// The card under the drawing: what the car is, and a few numbers.
function modelCard(t, c, i) {
  const m = modelOf(c, i), car = c.cars[i];
  const name = m?.model || car?.type?.name || T("This car");
  const sub = m ? [m.type, m.built].filter(Boolean).join(" · ") : "";
  const keys = m?.powerHp ? ["topSpeedMph", "powerHp", "fleet"] : ["seats", "topSpeedMph", "fleet"];
  return `<div class="model-card">
    <div class="model-card-head">
      <div><strong>${esc(name)}</strong>${car?.number ? ` <span class="model-num">${esc(car.number)}</span>` : ""}${sub ? `<span>${esc(sub)}</span>` : ""}</div>
      <button type="button" class="icon-btn sm" data-car-close aria-label="${T("Close")}">${CLOSE_ICON}</button>
    </div>
    ${m ? `<dl class="facts">${facts(m, keys, unitsOf(t.agency))}</dl>` : ""}
    <button type="button" class="link-btn" data-model-more>${esc(T("More about the {model}", { model: m?.model || car?.type?.name || T("car") }))} ›</button>
  </div>`;
}

// The model's full page, in place of the train's: a large drawing, every
// fact, a short history and its source, and whether the cars shown are this
// train's own or only what usually runs.
function renderModelPage(t, el) {
  const c = consistOf(t);
  const i = state.car.i, m = c && modelOf(c, i), car = c?.cars[i];
  if (!c || !car) { state.car = null; return renderDetail(); }
  const a = AGENCIES[t.agency];
  const width = Math.min(560, Math.max(240, el.clientWidth - 8));
  const why = !c.typical ? ""
    : c.reported ? T("{rr}’s feed names one car, {number} ({name}); the rest is what typically runs on this line.", { rr: a.short, number: c.reported.number, name: c.reported.name })
    : T("{rr} doesn’t report this train’s cars; this is what typically runs on this route.", { rr: a.short });
  const source = m?.source ? (() => { try { const h = new URL(m.source).hostname.replace(/^www\./, ""); return /wikipedia/.test(h) ? "Wikipedia" : h; } catch { return T("Source"); } })() : null;
  el.innerHTML = `
    <button type="button" class="link-btn back-link" data-model-back>‹ ${esc(t.backLabel || (t.number ? T("Train {n}", { n: t.number }) : trainTitle(t)))}</button>
    <div class="model-page">
      <div class="model-art">${carSvg(c, i, a.color, width, "tsc_m")}</div>
      <h2>${esc(m?.model || car.type?.name || T("This car"))}</h2>
      <p class="model-sub">${esc([m?.type, m?.builder].filter(Boolean).join(" · ") || car.type?.name || "")}${car.number && !t.fleet ? ` · ${T("No.")} ${esc(car.number)}` : ""}</p>
      ${m ? `<dl class="facts wide">${facts(m, ["built", "fleet", "topSpeedMph", "powerHp", "seats", "lengthFt"], unitsOf(t.agency))}</dl>` : ""}
      ${m?.about ? `<p class="model-about">${esc(m.about)}</p>` : ""}
      ${source ? `<p class="model-source">${T("Source:")} <a href="${esc(m.source)}" target="_blank" rel="noopener">${esc(source)}</a></p>` : ""}
      ${c.typical && !t.fleet ? `<div class="model-note"><strong>${T("Car count and type may not be accurate.")}</strong> ${esc(why)}${c.summary ? ` ${esc(T("Typical for this route: {summary}.", { summary: c.summary }))}` : ""}</div>` : ""}
    </div>`;
}

function fmtIn(ms) {
  const min = Math.round((ms - Date.now()) / 60000);
  if (min <= 0) return T("now");
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
}

// How late, one way everywhere: under five minutes is on time (green); five
// or more is late (orange). Red is kept for a train that isn't running.
const LATE_MIN = 5;
function lateText(min) {
  if (min == null || Number.isNaN(min)) return { text: "", cls: "neutral" };
  if (min < LATE_MIN) return { text: T("On time"), cls: "good" };
  const m = Math.round(min);
  const text = m < 60 ? T("{n} min late", { n: m }) : T("{h} h {m} min late", { h: Math.floor(m / 60), m: m % 60 });
  return { text, cls: "warn" };
}

// A train's status as its feed parser wrote it ("On time", "12 min late",
// "At Yuma"), in the page's language.
function statusLabel(text) {
  if (!text || lang === "en") return text || "";
  let m;
  if ((m = text.match(/^(\d+) min late$/))) return T("{n} min late", { n: m[1] });
  if ((m = text.match(/^(\d+) h (\d+) min late$/))) return T("{h} h {m} min late", { h: m[1], m: m[2] });
  if ((m = text.match(/^Stopped at (.+)$/))) return T("Stopped at {place}", { place: m[1] });
  if ((m = text.match(/^Held at (.+)$/))) return T("Held at {place}", { place: m[1] });
  if ((m = text.match(/^At (.+)$/))) return T("At {place}", { place: m[1] });
  return T(text);
}

// A station's next train: its plate, where it's going, the track as a
// platform-sign badge, and a countdown tile (the clock time beneath).
function departureRow({ id, color, badge, title, sub, time, tz, status, statusCls, inferred, track, likely }) {
  const min = time ? Math.round((time - Date.now()) / 60000) : null;
  const clock = time ? fmtTime(new Date(time).toISOString(), tz) : "";
  const big = min == null ? "—" : min <= 0 ? T("Now") : min < 60 ? `${min}<small>min</small>` : esc(clock);
  const small = min == null ? "" : min < 60 ? clock : T("in {time}", { time: fmtIn(time) });
  const statusHtml = status ? `<span class="status-t ${statusCls}${inferred ? " inferred" : ""}"${inferred ? ` title="${INFERRED_TITLE}"` : ""}>${esc(status)}</span>` : "";
  const inner = `${plate(badge, color, "sm")}
    <span class="what"><span class="title">${esc(title)}</span><span class="sub">${[statusHtml, esc(sub || "")].filter(Boolean).join(" · ")}</span></span>
    ${track ? `<span class="trk" title="${esc(T("Track {n}", { n: track }))}" aria-label="${esc(T("Track {n}", { n: track }))}">${esc(track)}</span>`
      : likely ? `<span class="trk likely" title="${esc(likely.title)}" aria-label="${esc(likely.title)}">${esc(likely.tracks.join("/"))}</span>` : "<span></span>"}
    <span class="cd${statusCls === "warn" || statusCls === "bad" ? ` ${statusCls}` : ""}${min >= 60 ? " far" : ""}"><strong>${big}</strong>${small ? `<span>${esc(small)}</span>` : ""}</span>`;
  return id
    ? `<button class="dep" data-select="${esc(id)}">${inner}</button>`
    : `<div class="dep">${inner}</div>`;
}

const WHEELCHAIR_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><circle cx="11" cy="4" r="2" fill="currentColor"/><path d="M10 7.5v6h5.5l2.5 5.5M10 10.5h5M7.8 11.3a5.5 5.5 0 1 0 7.7 6.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// A clock time in a given zone, in the chosen 12- or 24-hour style.
const clockIn = (ms, tz) => {
  try { return dateFormat({ ...clockOptions(), timeZone: tz }).format(new Date(ms)); } catch { return ""; }
};
// The station's local time, when it isn't what the page's times are shown in.
function localTimeNote(st) {
  if (!st.tz || state.timeZone === "station") return "";
  const now = Date.now(), shown = clockIn(now, state.timeZone || undefined), there = clockIn(now, st.tz);
  return there && there !== shown ? T("Local time {time}", { time: there }) : "";
}

function renderStation() {
  const st = state.stations.get(state.station);
  const el = $("train-detail");
  if (!st) return;
  const trains = [...state.trains.values()].filter(inLists);
  const arrivals = state.stationView === "arr";
  const extras = state.stationExtras?.id === st.id ? state.stationExtras : null;

  // Live trains: MBTA predictions where available, then trains on the map
  // that stop here. Departures leave out trains ending here; arrivals leave
  // out trains starting here.
  const rows = [];
  const listed = new Set();
  for (const p of state.predictions || []) {
    const time = arrivals ? p.arr : p.dep;
    if (!time) continue;
    const t = p.trainId && state.trains.get(p.trainId);
    if (t) listed.add(t.id);
    rows.push({
      sort: time,
      html: departureRow({
        id: t?.id, color: AGENCIES.mbta.color, badge: p.number || "MBTA",
        title: arrivals && t?.origin ? T("from {place}", { place: t.origin }) : p.headsign ? T("to {place}", { place: p.headsign }) : p.route,
        sub: p.route, time, tz: p.tz, status: p.status || "", statusCls: "neutral", track: p.track,
      }),
    });
  }
  for (const d of trainsDue(st, trains)) {
    if (listed.has(d.train.id) || (state.predictions && d.train.agency === "mbta")) continue;
    if (arrivals ? d.originates : d.terminates) continue;
    listed.add(d.train.id);
    const t = d.train, a = AGENCIES[t.agency];
    const time = (arrivals ? d.arr : d.dep) ?? d.time;
    const late = d.here ? { text: T("At station"), cls: "good" } : lateText(d.lateMin);
    const track = d.track || (t.agency === "njt" && extras?.tracks?.get(String(t.number))) || null;
    const likely = track ? null : usualTrack(st, t);
    rows.push({
      sort: time ?? Date.now(),
      likely: Boolean(likely),
      html: departureRow({
        id: t.id, color: a.color, badge: t.number || a.short,
        title: arrivals ? (t.origin ? T("from {place}", { place: t.origin }) : trainTitle(t)) : t.destination ? T("to {place}", { place: t.destination }) : trainTitle(t),
        // Arrivals say where the train is now, for whoever's meeting it.
        sub: [arrivals && !d.here ? whereNow(t, st) : "", a.short, arrivals ? "" : t.route].filter(Boolean).join(" · "),
        time, tz: d.tz, status: late.text, statusCls: late.cls, inferred: Boolean(t.inferred) && !d.here,
        track, likely,
      }),
    });
  }
  rows.sort((x, y) => x.sort - y.sort);

  const loading = (st.agencies.includes("mbta") && state.predictions === null) || st.agencies.some(isLoading);
  // Served by: each railroad (opening its page), its lines folded under it
  // (each opening the line's page). Lines come from its timetables and the
  // routes of trains stopping here (Amtrak's, whose stations name no lines);
  // "City Terminal Zone" is an LIRR scheduling zone, not a line riders know.
  const catalog = allLines(), onLines = new Map(); // railroad|line -> { agency, name, running }
  const addLine = (agency, name) => {
    if (!name || name === "City Terminal Zone") return;
    const k = lineKey(name);
    const l = catalog.find((x) => x.agency === agency && sameLine(lineKey(x.name), k)) || { agency, name, running: 0 };
    onLines.set(`${agency}|${lineKey(l.name)}`, l);
  };
  for (const m of st.members) for (const l of m.lines || []) addLine(m.agency, l);
  for (const t of state.trains.values()) if (t.route && t.stops?.some((s) => st.keys.has(s.key))) addLine(t.agency, t.route);
  const lineRow = (l) => {
    return `<li><button type="button" class="rr-line" data-open-line="${esc(l.name)}" data-line-railroad="${l.agency}"><span class="served-name">${lineMark(l.agency, l.name)}<span>${esc(l.name)}</span></span><span class="sub">${l.running ? T("{n} running", { n: l.running }) : T("none running")} ›</span></button></li>`;
  };
  const outHere = unservedHere(st);
  const servedBy = st.members.map((m) => {
    const a = AGENCIES[m.agency];
    const out = outHere.some((d) => d.agency === m.agency);
    const lines = [...onLines.values()].filter((l) => l.agency === m.agency).sort((x, y) => y.running - x.running || x.name.localeCompare(y.name));
    const open = state.servedOpen.has(m.agency);
    const sub = [m.daily ? Tn(m.daily, "{n} train a weekday", "{n} trains a weekday") : a.kind === "intercity" ? T("Intercity trains") : "",
      lines.length ? Tn(lines.length, "{n} line", "{n} lines") : ""].filter(Boolean).join(" · ");
    const name = `<span class="dot" style="background:${a.color}"></span><span><strong>${esc(a.name)}</strong>${sub || out ? `<br><span class="sub">${out ? `<span class="sb-out">${T("No trains right now")}</span>${sub ? " · " : ""}` : ""}${esc(sub)}</span>` : ""}</span>`;
    return `<li class="sb${open ? " open" : ""}">
      <div class="sb-row">
        ${lines.length
          ? `<button type="button" class="sb-toggle" data-served-toggle="${m.agency}" aria-expanded="${open}">${name}<svg class="chev" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`
          : `<button type="button" class="sb-toggle" data-railroad="${m.agency}">${name}<span class="sb-go">›</span></button>`}
      </div>
      ${open ? `<ul class="sb-lines">${lines.map(lineRow).join("")}</ul>` : ""}
    </li>`;
  }).join("");
  const local = localTimeNote(st);
  const access = st.access === 1 ? `<span class="access yes">${WHEELCHAIR_ICON}${T("Step-free access")}</span>`
    : st.access === 0 ? `<span class="access no">${WHEELCHAIR_ICON}${T("Not step-free")}</span>` : "";

  const liftsOut = extras?.lifts?.lifts.some((l) => l.out);
  const liftsHtml = liftsSection(extras?.lifts);
  const hero = `<div class="hero">
      <div class="agency-name" style="color:var(--muted)">
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M12 2c4 0 8 .5 8 4v9.5a3.5 3.5 0 0 1-3.5 3.5l1.5 1.5v.5h-2l-2-2h-4l-2 2H6v-.5L7.5 19A3.5 3.5 0 0 1 4 15.5V6c0-3.5 4-4 8-4Zm0 2c-3.5 0-5.5.5-6 1.5V10h12V5.5C17.5 4.5 15.5 4 12 4ZM7.5 13a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"/></svg>
        ${T("Station")}${st.place ? ` · ${esc(st.place)}` : ""}
      </div>
      <h2>${esc(st.name)}</h2>
      ${local || access ? `<p class="station-facts">${local ? `<span>${esc(local)}</span>` : ""}${access}</p>` : ""}
      ${outHere.map((d) => `<div class="oos-note" style="--c:${AGENCIES[d.agency].color}">${d.buses ? BUS_ICON : NO_SERVICE_ICON}
        <span><strong>${esc(T("No {railroad} trains here right now", { railroad: AGENCIES[d.agency].short }))}</strong><span>${esc(d.header)}</span></span></div>`).join("")}
    </div>`;
  renderParts(el, `station:${st.id}`, [hero,
    rrSection("served", T("Served by"), st.members.length, `<ul class="served-by">${servedBy}</ul>`),
    noticesBlock(extras?.notices || [], null, T("Station notices")),
    liftsOut ? liftsHtml : "",
    nextTrainsSection(rows, arrivals, loading),
    atStation(st, extras),
    liftsOut ? "" : liftsHtml]);
}

// Where an arriving train is now: standing at a station, or its next stop.
function whereNow(t, st) {
  const at = t.stops?.find((s) => s.here) || (t.statusText?.startsWith("At ") && { name: t.statusText.slice(3) });
  if (at && !st.names.has(norm(at.name))) return T("now at {place}", { place: at.name });
  const next = t.stops?.find((s) => s.status === "next")?.name || t.nextStop;
  if (!next) return "";
  return st.names.has(norm(next)) ? T("coming here next") : T("next stop {place}", { place: next });
}

// Usual tracks: at the big terminals a track goes up only minutes before a
// train leaves. The relay notes the tracks posted there every day (GET
// /tracks/:railroad/:stop); until a train's real one is posted, its row
// shows the track it has used on most of its recent days, dashed.
const USUAL_TRACK_STOPS = { lirr: ["237", "349", "241", "102"], mnr: ["1"], njt: ["NY", "HB", "NP", "SE"] };
const usualTracks = new Map(); // "railroad:stop" -> { at, trains: { number: [[track, days], ...] } }
const usualStop = (m) => (m.agency === "njt" ? m.code : m.id);
function loadUsualTracks(st) {
  if (!RELAY) return;
  for (const m of st.members) {
    const stop = usualStop(m), key = `${m.agency}:${stop}`, had = usualTracks.get(key);
    if (!USUAL_TRACK_STOPS[m.agency]?.includes(stop) || (had && Date.now() - had.at < 30 * 60 * 1000)) continue;
    usualTracks.set(key, { at: Date.now(), trains: had?.trains || {} }); // asked; not again for a while
    fetch(`${RELAY.replace(/\/$/, "")}/tracks/${m.agency}/${encodeURIComponent(stop)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!json?.trains) return;
        usualTracks.set(key, { at: Date.now(), trains: json.trains });
        if (state.station === st.id) renderDetail();
      })
      .catch(() => {});
  }
}
// One track it has used on at least 60% of its last days (three or more), or
// two between them on 80%.
function usualTrack(st, t) {
  const m = t.number && st.members.find((x) => x.agency === t.agency);
  const days = m && usualTracks.get(`${m.agency}:${usualStop(m)}`)?.trains?.[String(t.number)];
  if (!days) return null;
  const of = days.reduce((sum, [, n]) => sum + n, 0);
  if (of < 3) return null;
  const [a, b] = days;
  if (a[1] / of >= 0.6) {
    return { tracks: [a[0]], title: T("Not posted yet. Usually track {track}: {n} of its last {of} days.", { track: a[0], n: a[1], of }) };
  }
  if (b && (a[1] + b[1]) / of >= 0.8) {
    const two = [a[0], b[0]].sort((x, y) => x.localeCompare(y, undefined, { numeric: true }));
    return { tracks: two, title: T("Not posted yet. Usually track {a} or {b}: {n} of its last {of} days.", { a: two[0], b: two[1], n: a[1] + b[1], of }) };
  }
  return null;
}

// At the station: what it has, from OpenStreetMap (data/amenities.json,
// scripts/build_amenities.py) and, live, the MBTA's own facilities; and its
// street address (Amtrak's), opening a map.
let amenitiesData = null;
function amenities() {
  if (!amenitiesData) {
    amenitiesData = {};
    fetch("data/amenities.json?v=dev").then((r) => r.json()).then((d) => {
      amenitiesData = d;
      if (state.station) renderDetail();
    }).catch((err) => console.warn("amenities", err));
  }
  return amenitiesData;
}
const AMENITY_ROW_ICON = {
  ticket: '<path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4zM14 7v10" stroke-dasharray="2 2"/>',
  machine: '<path d="M7 3h10v18H7zM10 7h4M10 11h4M10 17h4"/>',
  restroom: '<path d="M7 7.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17 7.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM5 20v-6H4l1-5h4l1 5H9v6M15 20v-9h4v9M12 3v18"/>',
  elevator: '<path d="M5 3h14v18H5zM9 9l3-3 3 3M9 15l3 3 3-3"/>',
  parking: '<path d="M5 3h14v18H5zM10 17V7h3a3 3 0 0 1 0 6h-3"/>',
  bike: '<path d="M6 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15l4-7h5l3 7M10 8l2 7h-6"/>',
  share: '<path d="M6 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15l4-7h5l3 7M15 4h3"/>',
  taxi: '<path d="M5 16l1.5-5h11l1.5 5M4 16h16v3H4zM9 8h6l-1-3h-4z"/>',
  food: '<path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v5m4-5v5M17 21V3c-2 1-3 3.5-3 7 0 1.7.9 3 3 3"/>',
};
function atStation(st, extras) {
  const all = amenities(), f = extras?.facilities, address = extras?.address;
  // Every railroad's stop here, combined.
  const o = {};
  for (const m of st.members) {
    const x = all[`${m.agency}:${m.id}`];
    if (!x) continue;
    for (const [k, v] of Object.entries(x)) o[k] = typeof v === "number" && k !== "pr" ? Math.max(o[k] ?? 0, v) : v;
  }
  const rows = [];
  const row = (icon, label, detail = "") => rows.push(`<li><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${AMENITY_ROW_ICON[icon]}</svg><span>${esc(T(label))}</span>${detail ? `<span class="am-detail">${esc(detail)}</span>` : ""}</li>`);
  if (f?.ticketWindow || o.k) row("ticket", "Ticket office");
  const machines = f?.machines || o.v;
  if (machines) row("machine", machines === 1 ? "Ticket machine" : "Ticket machines", machines > 1 ? `${machines}` : "");
  if (o.w) row("restroom", "Restrooms");
  const elevators = f?.elevators || o.e;
  if (elevators) row("elevator", elevators === 1 ? "Elevator" : "Elevators", elevators > 1 ? `${elevators}` : "");
  const lot = f?.parking?.[0];
  if (lot || o.p != null) {
    const spaces = lot?.spaces || o.p;
    const fee = lot && (lot.fee.match(/Daily Max:\s*\$\d+/i)?.[0].replace(/Daily Max:\s*/i, "") || lot.fee.match(/\$\d+(\.\d\d)?/)?.[0]);
    row("parking", o.pr ? "Park and ride" : "Parking", [spaces ? T("{n} spaces", { n: spaces.toLocaleString(locale) }) : "", fee ? T("{fee} a day", { fee }) : ""].filter(Boolean).join(" · "));
  }
  const bikes = f?.bikes || o.b;
  if (f?.bikes || o.b != null) row("bike", "Bike parking", bikes ? T("{n} spaces", { n: bikes }) : "");
  if (o.s) row("share", "Bike share");
  if (o.x) row("taxi", "Taxi stand");
  if (o.f) row("food", "Places to eat nearby", `${o.f}`);
  if (!rows.length && !address) return "";
  const map = address && `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  return rrSection("at-station", T("At the station"), null, `${rows.length ? `<ul class="amenities">${rows.join("")}</ul>` : ""}
    ${address ? `<a class="st-address" href="${esc(map)}" target="_blank" rel="noopener"><span>${esc(address)}</span><span aria-hidden="true">↗</span></a>` : ""}
    ${rows.length ? `<p class="estimate-note">${T(f ? "From the MBTA and OpenStreetMap; may be incomplete." : "From OpenStreetMap; may be incomplete.").replace("OpenStreetMap", '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>')}</p>` : ""}`);
}

// Elevators and escalators (js/lifts.js): any that are out first, with when
// they went out and when they're due back; the working ones folded into one
// line that opens to the list. Shown above the next trains while something's
// out, at the bottom of the page otherwise.
const ESCALATOR_ICON = '<path d="M3 19h4l9-11h5M3 19v2h18V8"/>';
function liftsSection(data) {
  if (!data?.lifts.length) return "";
  const out = data.lifts.filter((l) => l.out), working = data.lifts.filter((l) => !l.out);
  const when = (ms) => {
    if (!ms) return "";
    const d = new Date(ms), today = new Date().toDateString() === d.toDateString();
    return today ? fmtTime(d.toISOString()) : dateFormat({ month: "short", day: "numeric" }).format(d);
  };
  const icon = (l) => `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${l.kind === "escalator" ? ESCALATOR_ICON : AMENITY_ROW_ICON.elevator}</svg>`;
  const what = (l) => T(l.kind === "escalator" ? "Escalator" : "Elevator");
  const outRow = (l) => {
    const sub = [l.since ? T("Out since {time}", { time: when(l.since) }) : T("Out of service"),
      l.until && l.until > Date.now() ? T("due back {time}", { time: when(l.until) }) : "", l.note].filter(Boolean).join(" · ");
    return `<li class="lift out">${icon(l)}<span class="lift-what"><strong>${esc(l.name)}</strong><span class="lift-sub">${esc(`${what(l)} · ${sub}`)}</span></span></li>`;
  };
  const workingRows = working.map((l) => `<li class="lift">${icon(l)}<span class="lift-what"><span>${esc(l.name)}</span><span class="lift-sub">${esc(what(l))}</span></span></li>`).join("");
  // (A toggle the page remembers, not <details>: the page redraws every 30 seconds.)
  const open = state.liftsOpen;
  const summary = !working.length ? ""
    : `<div class="lifts-ok${open ? " open" : ""}"><button type="button" class="lifts-ok-toggle" data-lifts-toggle aria-expanded="${open}"><span class="lift-dot" aria-hidden="true"></span>${esc(out.length ? Tn(working.length, "{n} other working", "{n} others working") : Tn(working.length, "{n} working", "All {n} working"))}</button>${open ? `<ul class="amenities lifts">${workingRows}</ul>` : ""}</div>`;
  const source = data.outagesOnly
    ? T("From {source}, which reports only what's out of service.", { source: data.source.map((x) => T(x)).join(T(" and ")) })
    : T("From {source}.", { source: data.source.map((x) => T(x)).join(T(" and ")) });
  return rrSection("lifts", T("Elevators and escalators"), out.length || null, `${out.length ? `<ul class="amenities lifts">${out.map(outRow).join("")}</ul>` : ""}
    ${summary}
    <p class="estimate-note">${esc(source)}</p>`);
}

// ---------- Railroad and line pages ----------
// From the i beside each railroad: the map frames its network and lights up
// its track; the page shows how its trains are doing, its lines, its fleet
// and where the data comes from. Each line has a page of its own, with just
// its track lit up.

function openRailroad(id, { fly = true, line = null } = {}) {
  if (!AGENCIES[id]) return;
  needData(id); // its stations, abroad
  if (state.hidden.has(id)) {
    state.hidden.delete(id);
    store.set("tt-hidden", [...state.hidden]);
    redraw();
    redrawStations();
    redrawRail();
  }
  remember(line ? { kind: "line", id: `${id}|${line}`, agency: id, name: line } : { kind: "railroad", id, agency: id, name: AGENCIES[id].name });
  clearInterval(predictionTimer);
  Object.assign(state, { selected: null, station: null, predictions: null, car: null, returnTo: null, railroad: id, line });
  focusCache.key = null;
  setBack(line ? AGENCIES[id].short : T("All trains"));
  setFollow(false);
  setUrlSelection();
  applySelectionFilter();
  showDetailView(true);
  renderAll();
  if (fly) frameFocus();
  if (isPhone) setSheet("");
}
const openLine = (id, name, opts = {}) => openRailroad(id, { ...opts, line: name });

// "Framingham / Worcester Line" and "Framingham/Worcester Line" are one line,
// and a timetable's "Franklin / Foxboro Line" is the "Franklin Line" (short
// names like "S Line" must match exactly). Any script's letters count, so a
// Greek or Hebrew line name isn't empty.
const lineKey = (l) => fold(l).replace(/\bline\b/g, "").replace(/[^\p{L}\p{N}]/gu, "");
const sameLine = (x, y) => x === y || (Math.min(x.length, y.length) >= 5 && (x.includes(y) || y.includes(x)));
const onLine = (t, name) => Boolean(t.route) && lineKey(t.route) === lineKey(name);

// Every railroad's lines, for search: from its stations' timetables and the
// routes its trains report (a timetable's longer name for a running line
// folds into it), with how many trains are on each.
// The catalog is worked out from every train and every station, so it's
// kept from one feed refresh to the next (the trains are a new Map each
// refresh) and until the stations arrive.
let linesCatalog = null, linesCatalogOf = null, linesCatalogStations = null;
function allLines() {
  if (linesCatalog && linesCatalogOf === state.trains && linesCatalogStations === state.stations) return linesCatalog;
  linesCatalogOf = state.trains;
  linesCatalogStations = state.stations;
  const out = linesCatalog = [];
  for (const id of Object.keys(AGENCIES)) {
    const lines = new Map(); // key -> { name, running }
    for (const t of state.trains.values()) {
      if (t.agency !== id || !t.route) continue;
      const k = lineKey(t.route);
      if (!lines.has(k)) lines.set(k, { name: t.route, running: 0 });
      lines.get(k).running++;
    }
    for (const st of state.stations.values()) {
      for (const m of st.members) {
        if (m.agency !== id) continue;
        for (const l of m.lines || []) {
          const k = lineKey(l);
          if (!l || l === "City Terminal Zone" || lines.has(k) || [...lines].some(([r, x]) => x.running && sameLine(k, r))) continue;
          lines.set(k, { name: l, running: 0 });
        }
      }
    }
    for (const l of lines.values()) out.push({ agency: id, ...l });
  }
  return out;
}

// Railroads with one line (SunRail, ACE, Brightline): their line's page
// would only repeat the railroad's. Counted from their stations' timetables.
const lineCounts = new Map();
function singleLine(agency) {
  if (!lineCounts.has(agency) && state.stations.size) {
    const names = new Set();
    for (const st of state.stations.values()) for (const m of st.members) if (m.agency === agency) for (const l of m.lines || []) names.add(lineKey(l));
    lineCounts.set(agency, names.size);
  }
  return (lineCounts.get(agency) ?? 2) <= 1;
}

// A line's own color where its trains carry one (GO's, MBTA's), else its
// railroad's.
const lineColor = (id, name) => lineColorOf(id, name);

// Each line's own color: its railroad's timetable (data/linecolors.json, from
// scripts/build_linecolors.py), else the one its running trains carry, else
// its railroad's.
let lineColorsData = {}, lineColorsDataAsked = false; // and the regions' (addRegion)
function lineColors() {
  if (!lineColorsDataAsked) {
    lineColorsDataAsked = true;
    fetch("data/linecolors.json?v=dev").then((r) => r.json()).then((d) => {
      lineColorsData = { ...d, ...lineColorsData };
      renderAll();
    }).catch((err) => console.warn("line colors", err));
  }
  return lineColorsData;
}
// Each line's color is looked up once per feed refresh: the answer holds
// until the trains or the timetable colors change.
let lineColorCache = null;
function lineColorOf(agency, name) {
  const colors = lineColors();
  if (lineColorCache?.trains !== state.trains || lineColorCache.colors !== colors) lineColorCache = { trains: state.trains, colors, of: new Map() };
  const key = `${agency}|${name}`;
  let color = lineColorCache.of.get(key);
  if (color !== undefined) return color;
  const own = colors[agency] || {}, k = lineKey(name);
  const hit = own[name] || Object.entries(own).find(([n]) => sameLine(lineKey(n), k))?.[1];
  color = hit || [...state.trains.values()].find((t) => t.agency === agency && t.routeColor && t.route && sameLine(lineKey(t.route), k))?.routeColor
    || AGENCIES[agency]?.color || "#8d95a3";
  lineColorCache.of.set(key, color);
  return color;
}
// The mark beside a line's name: a short stretch of line in its color.
const lineMark = (agency, name) => `<span class="line-mark" style="--c:${lineColorOf(agency, name)}" aria-hidden="true"></span>`;

// The open page's trains: the railroad's, or the line's.
function focusTrains() {
  const { railroad: id, line } = state;
  return [...state.trains.values()].filter((t) => t.agency === id && (!line || onLine(t, line)));
}
function lineStations(id, name) {
  const k = lineKey(name);
  const listed = [...state.stations.values()].filter((st) => st.members.some((m) => m.agency === id && (m.lines || []).some((l) => sameLine(lineKey(l), k))));
  if (listed.length) return listed;
  // Railroads whose station lists don't name lines (Amtrak): the stops of
  // the line's train with the most of them.
  const longest = focusTrains().filter((t) => onLine(t, name)).sort((x, y) => (y.stops?.length || 0) - (x.stops?.length || 0))[0];
  return [...new Set((longest?.stops || []).map((s) => state.stationOfKey?.get(s.key)).filter(Boolean))].map((sid) => state.stations.get(sid)).filter(Boolean);
}

// Places along a line in order: from the one farthest from the middle, each
// next the nearest one left.
function orderAlong(items, posOf) {
  if (items.length < 3) return items;
  const P = items.map(posOf);
  const mid = { lon: P.reduce((s, p) => s + p.lon, 0) / P.length, lat: P.reduce((s, p) => s + p.lat, 0) / P.length };
  const kx = Math.cos((mid.lat * Math.PI) / 180);
  const d = (p, q) => Math.hypot((p.lon - q.lon) * kx, p.lat - q.lat);
  let start = 0;
  P.forEach((p, i) => { if (d(p, mid) > d(P[start], mid)) start = i; });
  const order = [start], left = new Set(P.keys());
  left.delete(start);
  while (left.size) {
    const last = P[order[order.length - 1]];
    let best = -1;
    for (const j of left) if (best < 0 || d(last, P[j]) < d(last, P[best])) best = j;
    order.push(best);
    left.delete(best);
  }
  return order.map((i) => items[i]);
}

// A line's stations in the order its trains stop at them: the longest stop
// list running now, with other trains' stops (a branch, a short turn) fitted
// in beside their neighbors. A station the timetable also lists on another
// line counts only if one of this line's trains stops there now (MBTA lists
// Fairmount stations under the Providence Line for detours); the rest go
// where they add the least distance. The busiest end comes first. With no
// train running, by position along the line.
function orderedLineStations(id, name) {
  const all = lineStations(id, name), k = lineKey(name);
  const runs = focusTrains().filter((t) => onLine(t, name))
    .map((t) => [...new Set((t.stops || []).map((s) => state.stationOfKey?.get(s.key)).filter(Boolean))])
    .filter((r) => r.length > 1).sort((x, y) => y.length - x.length);
  const inRuns = new Set(runs.flat());
  const ownOnly = (st) => !st.members.some((m) => m.agency === id && (m.lines || []).some((l) => !sameLine(lineKey(l), k)));
  const extra = all.filter((st) => !inRuns.has(st.id) && ownOnly(st));
  if (!runs.length) return orderAlong(extra.length > 1 ? extra : all, stationPos);
  const order = [...runs[0]];
  for (let run of runs.slice(1)) {
    // Run it the same way as the order so far.
    const known = run.filter((sid) => order.includes(sid));
    if (known.length > 1 && order.indexOf(known[0]) > order.indexOf(known[known.length - 1])) run = [...run].reverse();
    run.forEach((sid, i) => {
      if (order.includes(sid)) return;
      const prev = run.slice(0, i).reverse().find((x) => order.includes(x));
      const next = run.slice(i + 1).find((x) => order.includes(x));
      if (prev) order.splice(order.indexOf(prev) + 1, 0, sid);
      else if (next) order.splice(order.indexOf(next), 0, sid);
      else order.push(sid);
    });
  }
  // Stations no train is stopping at now: wherever they lengthen the line least.
  const pos = (sid) => stationPos(state.stations.get(sid));
  const d = (p, q) => Math.hypot((p.lon - q.lon) * Math.cos((p.lat * Math.PI) / 180), p.lat - q.lat);
  for (const st of extra) {
    const p = stationPos(st);
    let best = 0, cost = d(p, pos(order[0]));
    for (let i = 1; i <= order.length; i++) {
      const c = i === order.length ? d(pos(order[i - 1]), p)
        : d(pos(order[i - 1]), p) + d(p, pos(order[i])) - d(pos(order[i - 1]), pos(order[i]));
      if (c < cost) { cost = c; best = i; }
    }
    order.splice(best, 0, st.id);
  }
  const daily = (sid) => state.stations.get(sid)?.members.find((m) => m.agency === id)?.daily || 0;
  if (daily(order[order.length - 1]) > daily(order[0])) order.reverse();
  return order.map((sid) => state.stations.get(sid)).filter(Boolean);
}

// The track to light up: the railroad's whole network, or the line's, traced
// along the rails between the stops its running trains make and between its
// stations in order.
const focusCache = { key: null, features: [] };
function focusFeatures() {
  const { railroad: id, line } = state;
  if (!id || !state.railGeo) return [];
  // The line's color arrives with its trains, so it's part of the key.
  const color = line ? lineColor(id, line) : AGENCIES[id].color;
  const key = `${id}|${line || ""}|${color}`;
  if (focusCache.key === key) return focusCache.features;
  const props = { color };
  const features = line
    ? lineTrack(id, line).map((coordinates) => ({ type: "Feature", geometry: { type: "LineString", coordinates }, properties: props }))
    : state.railGeo.features.filter((f) => !f.properties.h && [f.properties.a, f.properties.b, f.properties.c].includes(id))
      .map((f) => ({ type: "Feature", geometry: f.geometry, properties: props }));
  if (features.length) Object.assign(focusCache, { key, features }); // else the rail index may not be ready yet
  return features;
}
function lineTrack(id, name) {
  const rail = state.rail;
  if (!rail) return [];
  const seqs = focusTrains().map((t) => (t.stops || []).map((s) => state.stopPos.get(s.key)).filter(Boolean)).filter((s) => s.length > 1);
  seqs.push(orderedLineStations(id, name).map(stationPos)); // stretches no train is on now
  const done = new Set(), out = [];
  for (const seq of seqs) {
    for (let i = 1; i < seq.length; i++) {
      const p = [seq[i - 1].lon, seq[i - 1].lat], q = [seq[i].lon, seq[i].lat];
      const k = [p, q].map((x) => x.map((v) => v.toFixed(4)).join()).sort().join("|");
      if (done.has(k)) continue;
      done.add(k);
      const path = rail.route(rail.snap(p, 1500, id), rail.snap(q, 1500, id), id);
      if (path?.coords.length > 1) out.push(path.coords);
      // Track newer than the map's rail data (South Shore's Monon Corridor):
      // a straight line between neighboring stations, so the line still shows.
      else if (Math.hypot((p[0] - q[0]) * 85, (p[1] - q[1]) * 111) < 25) out.push([p, q]);
    }
  }
  return out;
}

// Light up the open page's track (or clear it).
function applyFocus() {
  map.getSource("focus")?.setData({ type: "FeatureCollection", features: focusFeatures() });
}

// The lit-up track, stations and trains, framed beside the panel.
function frameFocus() {
  const { railroad: id, line } = state;
  const b = new maplibregl.LngLatBounds();
  for (const f of focusFeatures()) {
    const g = f.geometry;
    for (const c of g.type === "LineString" ? g.coordinates : g.coordinates.flat()) b.extend(c);
  }
  const stations = line ? lineStations(id, line) : [...state.stations.values()].filter((st) => st.agencies.includes(id));
  for (const st of stations) b.extend([stationPos(st).lon, stationPos(st).lat]);
  for (const t of focusTrains()) if (Number.isFinite(t.lat)) b.extend([t.lon, t.lat]);
  if (b.isEmpty()) return;
  const pad = panelPadding();
  let padding = { top: Math.max(60, pad.top + 20), right: 60, bottom: Math.max(60, pad.bottom + 20), left: Math.max(60, pad.left + 40) };
  // Where the margins leave no room to fit it, use smaller ones (else the map
  // wouldn't move at all).
  if (!map.cameraForBounds(b, { padding })) padding = { top: 20, right: 20, bottom: Math.min(padding.bottom, innerHeight / 3), left: Math.min(padding.left, innerWidth / 3) };
  map.stop(); // whatever was moving the map gives way
  map.fitBounds(b, { padding, maxZoom: 11, duration: 900 });
}

// A page section under a heading that folds it away (with its count, so a
// folded section still says something).
function rrSection(key, title, count, body) {
  const open = !state.rrCollapsed.has(key);
  return `<section class="rr-sec${open ? "" : " collapsed"}">
    <h3 class="section-title"><button type="button" class="notices-toggle" data-rr-section="${key}" aria-expanded="${open}">
      ${esc(title)}${count == null ? "" : ` <span class="rr-count">${count}</span>`}
      <svg class="chev" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button></h3>
    ${open ? body : ""}
  </section>`;
}

// A section that always stays open: its heading and count, then its body.
function plainSection(title, count, body) {
  return `<section class="rr-sec">
    <h3 class="section-title">${esc(title)}${count == null ? "" : ` <span class="rr-count">${count}</span>`}</h3>
    ${body}
  </section>`;
}

// A stand-in train for a line's typical consist (or, given one car's number,
// the consist that car runs in), so its cars draw and open model pages like
// a live train's.
const fleetTrain = (id, route, number) => ({ id: `fleet:${id}:${route || ""}:${number || ""}`, agency: id, route: route || null,
  number: null, fleet: true, backLabel: state.line || AGENCIES[id].name, cars: number ? { numbers: [number], complete: false } : null, stops: null });

// The model page for a car tapped in a page's fleet.
function fleetModelPage(id, el) {
  // A car seen on a running train is drawn from that train, while it runs.
  const live = state.car.train && state.trains.get(state.car.train);
  return renderModelPage(live ? { ...live, fleet: true, backLabel: state.line || AGENCIES[id].name } : fleetTrain(id, state.car.fleet, state.car.number), el);
}

// Every car type running on these lines: from their typical trains, the
// trains running now (Amtrak's equipment goes by train, not line) and, for a
// whole railroad, its fleet roster. Each is drawn once and opens its model
// page; locomotives first, then powered cars, then coaches.
function equipmentList(id, lineNames, trains, roster) {
  const a = AGENCIES[id], kinds = new Map(); // type key -> { route, number, trainId, i, c }
  const add = (c, from) => c?.cars.forEach((car, i) => {
    const k = car.type?.key;
    if (k && !kinds.has(k)) kinds.set(k, { ...from, i, c });
  });
  for (const name of lineNames.length ? lineNames : [null]) add(consistOf(fleetTrain(id, name)), { route: name });
  for (const t of trains) add(consistOf(t), { route: t.route, trainId: t.id });
  if (roster) {
    for (const { number } of fleetSamples(id)) add(consistOf(fleetTrain(id, lineNames[0] ?? null, number)), { route: lineNames[0] ?? null, number });
  }
  const rank = (k) => ({ diesel: 0, electric: 0, emu: 1 })[kinds.get(k).c.cars[kinds.get(k).i].type.kind] ?? 2;
  const html = [...kinds.keys()].sort((x, y) => rank(x) - rank(y)).map((k) => {
    const { route, number, trainId, i, c } = kinds.get(k);
    const m = modelOf(c, i), car = c.cars[i];
    const sub = [m?.type, m?.fleet].filter(Boolean).join(" · ");
    return `<button class="rr-car" data-fleet-car data-route="${esc(route || "")}" data-number="${esc(number || "")}" data-train="${esc(trainId || "")}" data-i="${i}">
      ${carSvg(c, i, a.color, 128, `tsc_f${idToken(k)}`)}
      <span><span class="title">${esc(m?.model || car.type?.name || T("Car"))}</span>${sub ? `<br><span class="sub">${esc(sub)}</span>` : ""}</span>
    </button>`;
  }).join("");
  return { html, count: kinds.size };
}

const statTile = (n, label, cls = "") => `<div class="rr-stat ${cls}"><strong>${n}</strong><span>${label}</span></div>`;
function trainStats(trains) {
  const late = trains.filter((t) => t.delayMin > 5).length;
  const onTime = trains.filter((t) => t.delayMin != null && t.delayMin <= 5).length;
  // A feed that reports no delays (Metra's) can't say what's on time or late.
  const delays = !trains.length || onTime + late > 0;
  return `<div class="rr-stats">
      ${statTile(trains.length, T(trains.length === 1 ? "train running" : "trains running"))}
      ${delays ? `${statTile(onTime, T("on time"), "good")}
      ${statTile(late, T("over 5 min late"), late ? "warn" : "")}` : statTile("—", T("no delay data"), "wide")}
    </div>`;
}
// Placeholder rows, shimmering while a railroad's feed is still loading.
const skeletonRows = (n = 3) => Array.from({ length: n }, (_, i) =>
  `<div class="sk-row" aria-hidden="true"><span class="sk sk-plate"></span><span class="sk-lines"><span class="sk" style="width:${[62, 48, 70][i % 3]}%"></span><span class="sk sk-sub" style="width:${[38, 30, 44][i % 3]}%"></span></span><span class="sk sk-end"></span></div>`).join("");
const isLoading = (agency) => state.sourceStatus[SOURCES.find((s) => s.agencies.includes(agency))?.id]?.status === "loading";

// The trains running on a line now, for its page.
function runningList(a, trains) {
  const running = [...trains].sort((x, y) => String(x.number).localeCompare(String(y.number), undefined, { numeric: true }));
  return `<div class="rr-trains">${running.length ? running.slice(0, 40).map((t) => `<button class="result" data-select="${esc(t.id)}">
        ${plate(t.number || a.short, a.color, "sm")}
        <span><span class="title">${esc(t.destination ? T("to {place}", { place: t.destination }) : trainTitle(t))}</span><br><span class="sub">${esc(t.nextStop ? T("next {place}", { place: t.nextStop }) : "")}</span></span>
        ${statusSpan(t, "status") || "<span></span>"}
      </button>`).join("") + (running.length > 40 ? `<p class="sub">${T("and {n} more", { n: running.length - 40 })}</p>` : "")
      : `<p class="empty">${esc(T("None of its trains are running right now."))}</p>`}</div>`;
}

// A line's stations joined by a line in its color, like a train's stops.
function lineDiagram(id, list, color) {
  const a = AGENCIES[id];
  return `<ol class="stops line-stops" style="--line-color:${color}">${list.map((st) => {
    const d = st.members.find((m) => m.agency === id)?.daily;
    return `<li class="link" data-station="${esc(st.id)}" role="button" tabindex="0" title="${esc(T("{name} station", { name: st.name }))}">
      <span class="stop-dot" aria-hidden="true"></span><span>${esc(st.name)}</span><span class="time">${d ? esc(T("{n} a weekday", { n: d })) : ""}</span></li>`;
  }).join("")}</ol>`;
}

function renderRailroad() {
  if (state.line) return renderLine();
  const id = state.railroad, a = AGENCIES[id], el = $("train-detail");
  if (state.car?.page && state.car.fleet != null) return fleetModelPage(id, el);
  const src = SOURCES.find((s) => s.agencies.includes(id));
  const avail = src ? sourceAvailability(src) : { ok: false };
  const status = state.sourceStatus[src?.id];
  const trains = focusTrains();
  const estimated = trains.filter((t) => t.estimated).length;
  const stations = [...state.stations.values()].filter((st) => st.agencies.includes(id));

  // Lines: from its stations' timetables and the routes its trains report.
  const lines = new Map(); // key -> { name, running }
  for (const st of stations) {
    for (const m of st.members) {
      if (m.agency !== id) continue;
      for (const l of m.lines || []) if (l && l !== "City Terminal Zone" && !lines.has(lineKey(l))) lines.set(lineKey(l), { name: l, running: 0 });
    }
  }
  // A railroad whose timetable names one line runs every train on it,
  // whatever service its trains report (Caltrain's "Local Weekend").
  const only = lines.size === 1 ? [...lines.keys()][0] : null;
  for (const t of trains) {
    if (!t.route) continue;
    const k = only || lineKey(t.route);
    if (!lines.has(k)) lines.set(k, { name: t.route, running: 0 });
    lines.get(k).running++;
  }
  // A timetable's longer name for a running line folds into it.
  const runningKeys = [...lines].filter(([, l]) => l.running).map(([k]) => k);
  for (const [k, l] of lines) if (!l.running && runningKeys.some((r) => sameLine(k, r))) lines.delete(k);
  const lineList = [...lines.values()].sort((x, y) => y.running - x.running || x.name.localeCompare(y.name));
  const fleet = equipmentList(id, lineList.map((l) => l.name), trains, true);

  const source = !avail.ok ? avail.reason || T("Not connected")
    : avail.timetable ? avail.reason
    : estimated && estimated === trains.length ? T("Positions estimated from predicted times")
    : trains.length ? T("Live GPS positions") : T("No trains reporting right now");
  const updated = status?.at ? ` · ${T("updated {ago}", { ago: fmtAgo(status.at) })}` : "";

  const hero = `<div class="hero">
      <div class="agency-name" style="color:${a.color}"><span class="dot" style="background:${a.color}"></span>${T(a.kind === "intercity" ? "Intercity" : "Commuter rail")} · ${esc(T(a.region))}</div>
      <h2>${esc(a.name)}</h2>
      <p class="station-facts"><span>${esc(source)}${esc(updated)}</span></p>
    </div>`;
  renderParts(el, `railroad:${id}`, [hero,
    !trains.length && avail.ok && status?.status === "ok" ? quietCard(id) : "",
    trainStats(trains),
    lineList.length > 1 ? plainSection(T("Lines"), lineList.length,
      `<ul class="rr-lines">${lineList.map((l) => `<li><button type="button" class="rr-line" data-line="${esc(l.name)}"><span class="served-name">${lineMark(id, l.name)}<span>${esc(l.name)}</span></span><span class="sub">${l.running ? T("{n} running", { n: l.running }) : T("none running")} ›</span></button></li>`).join("")}</ul>`) : "",
    fleet.count ? rrSection("fleet", T("Fleet"), fleet.count, `<p class="rr-hint">${T("Tap one to read about it.")}</p><div class="rr-cars">${fleet.html}</div>`) : "",
    src ? `<p class="estimate-note">${T("Data:")} ${creditHtml(creditOf(src, avail.timetable))}</p>` : ""]);
}

// Quiet hours: nothing of a railroad's is running, so its page says when
// its first train goes (data/firsts.json, from its timetable).
let firstsData = {}, firstsDataAsked = false; // and the regions' (addRegion)
function firsts() {
  if (!firstsDataAsked) {
    firstsDataAsked = true;
    fetch("data/firsts.json?v=dev").then((r) => r.json()).then((d) => {
      firstsData = { ...d, ...firstsData };
      if (state.railroad) renderDetail();
    }).catch((err) => console.warn("firsts", err));
  }
  return firstsData;
}
// Minutes a zone is ahead of UTC at a moment.
function zoneOffset(ms, tz) {
  const p = Object.fromEntries(dateFormat({ timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" }, "en-US")
    .formatToParts(ms).map((x) => [x.type, x.value]));
  return (Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute) - Math.floor(ms / 60000) * 60000) / 60000;
}
function nextFirstTrain(id) {
  const all = firsts(), d = all[id];
  const start = d?.start || all.start; // a region's railroad: its own file's
  if (!d?.days || !start) return null;
  const [y, m, day] = start.split("-").map(Number), now = Date.now();
  let best = null;
  d.days.forEach((list, i) => {
    const noon = Date.UTC(y, m - 1, day + i, 12);
    const midnight = Date.UTC(y, m - 1, day + i) - zoneOffset(noon, d.tz || "UTC") * 60000;
    for (const [dep, number, line, origin] of list || []) {
      const at = midnight + dep * 60000;
      if (at > now && (!best || at < best.at)) best = { at, number, line, origin, tz: d.tz };
    }
  });
  return best;
}
function quietCard(id) {
  const a = AGENCIES[id], f = nextFirstTrain(id);
  const when = f && (f.at - Date.now() > 20 * 3600 * 1000
    ? T("{day} at {time}", { day: dateFormat({ weekday: "long", timeZone: (state.timeZone === "station" ? f.tz : state.timeZone) || undefined }).format(new Date(f.at)), time: fmtTime(new Date(f.at).toISOString(), f.tz) })
    : T("at {time}", { time: fmtTime(new Date(f.at).toISOString(), f.tz) }));
  return `<div class="quiet">
    <svg class="quiet-moon" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path fill="currentColor" d="M20.4 14.6A8.5 8.5 0 0 1 9.4 3.6a8.5 8.5 0 1 0 11 11Z"/></svg>
    <h3>${esc(T("{rr} is asleep", { rr: a.short }))}</h3>
    <p>${esc(f ? T("The first train leaves {place} {when}, in {time}.", { place: f.origin, when, time: fmtIn(f.at) }) : T("None of its trains are running right now."))}</p>
    ${f ? `<span class="quiet-first">${f.number ? plate(f.number, a.color, "xs") : ""}${lineMark(id, f.line)}${esc(f.line)}</span>` : ""}
  </div>`;
}

// A line's page: how its trains are doing, its typical train and its stations in order.
function renderLine() {
  const id = state.railroad, name = state.line, a = AGENCIES[id], el = $("train-detail");
  // The line's typical train, drawn and tappable like a train page's cars.
  const typical = fleetTrain(id, name);
  if (state.car?.page && state.car.id === typical.id) return renderModelPage(typical, el);
  const trains = focusTrains();
  const stations = orderedLineStations(id, name);
  // Keep the cars strip where it was scrolled across redraws.
  const strip = el.querySelector(".consist-strip");
  // (Not "data-line": that marks a tappable line row.)
  const keepStrip = el.dataset.stripOf === typical.id ? strip?.scrollLeft || 0 : 0;
  el.dataset.stripOf = typical.id;
  const hero = `<div class="hero">
      <div class="agency-name" style="color:${a.color}"><span class="dot" style="background:${a.color}"></span>${esc(a.name)}</div>
      <h2>${escTitle(name)}</h2>
      ${stations.length ? `<p class="station-facts"><span>${esc(T("{n} stations", { n: stations.length }))} · ${esc(stations[0].name)} – ${esc(stations[stations.length - 1].name)}</span></p>` : ""}
      ${consistSection(typical)}
    </div>`;
  renderParts(el, `line:${id}|${name}`, [hero, trainStats(trains),
    rrSection("running", T("Running now"), trains.length, runningList(a, trains)),
    stations.length ? rrSection("line-stations", T("Stations"), stations.length, lineDiagram(id, stations, lineColor(id, name))) : ""]);
  const shown = el.querySelector(".consist-strip");
  if (shown) shown.scrollLeft = keepStrip;
}

// A station's next trains: a folding section whose heading also switches
// between departures and arrivals.
function nextTrainsSection(rows, arrivals, loading) {
  const open = !state.rrCollapsed.has("next");
  return `<section class="rr-sec${open ? "" : " collapsed"}">
    <div class="deps-head">
      <h3 class="section-title"><button type="button" class="notices-toggle" data-rr-section="next" aria-expanded="${open}">
        ${T("Next trains")} <span class="rr-count">${Math.min(rows.length, 14)}</span>
        <svg class="chev" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button></h3>
      ${open ? `<div class="segmented two sm" id="station-view">
        <button data-station-view="dep" aria-pressed="${!arrivals}">${T("Departures")}</button>
        <button data-station-view="arr" aria-pressed="${arrivals}">${T("Arrivals")}</button>
      </div>` : ""}
    </div>
    ${open ? `<div class="deps">
      ${rows.length ? rows.slice(0, 14).map((r) => r.html).join("")
        : loading ? skeletonRows() : `<p class="empty">${T(arrivals ? "No live trains are reporting an arrival here right now." : "No live trains are reporting a departure here right now.")}</p>`}
    </div>
    <p class="estimate-note">${T("Times are live predictions from each railroad.")}${rows.slice(0, 14).some((r) => r.likely)
      ? ` ${T("A dashed track isn't posted yet: it's where that train has usually been on recent days.")}` : ""}</p>` : ""}
  </section>`;
}

// ---------- Tracked trains ----------
// For people riding a train, or following one someone they know is on.

const MAX_TRACKED = 3;
const LOST_MS = 30 * 60 * 1000;  // gone from its feed this long: trip finished or cancelled
const PAGE_OPENED = Date.now(); // trips that ended while the page was closed are dropped quietly

const trainLabel = (rec) => `${AGENCIES[rec.agency]?.short || ""} ${rec.number || ""}`.trim();
const saveTracked = () => {
  store.set("tt-tracked", state.tracked);
  account?.trackedChanged(state.tracked); // to the rider's other devices, when signed in
};

// The live train for a tracked record, if it's reporting. A feed can reuse a
// vehicle id for a different train, so the number has to match too.
function trackedTrain(rec) {
  const t = state.trains.get(rec.id);
  if (!t || (rec.number && t.number && String(t.number) !== String(rec.number))) return null;
  return t;
}

// The stop that ends tracking: the one chosen, else the final destination.
function endStop(t, rec) {
  if (!t.stops?.length) return null;
  return (rec.stopKey && t.stops.find((s) => s.key === rec.stopKey)) || t.stops[t.stops.length - 1];
}

function hasArrived(t, stop) {
  if (!stop) return false;
  if (stop.status === "past" || stop.here) return true;
  // Some feeds never mark the final stop: near it, after its time, counts.
  const pos = state.stopPos.get(stop.key), drawn = targetOf(t);
  return !!pos && Date.parse(stop.time) < Date.now() && meters(pos, drawn) < 400;
}

function checkTracked() {
  const now = Date.now();
  let changed = false;
  for (const rec of [...state.tracked]) {
    const src = SOURCES.find((s) => s.agencies.includes(rec.agency));
    if (!state.sourceStatus[src?.id]?.at) continue; // its feed hasn't loaded yet
    const t = trackedTrain(rec);
    if (t) {
      rec.lastSeen = now;
      const stop = endStop(t, rec);
      if (stop) {
        rec.eta = Date.parse(stop.time) || rec.eta;
        rec.stopName = stop.name;
      }
      if (stop && hasArrived(t, stop)) {
        finishRide(rec, Date.parse(stop.time) || now);
        untrack(rec.id, T("{train} arrived at {place}.", { train: trainLabel(rec), place: stop.name }));
        continue;
      }
      changed = true;
    } else if (rec.eta && rec.eta < now) {
      // Vanished after its arrival time: it got there and the trip ended.
      finishRide(rec, rec.eta);
      untrack(rec.id, rec.lastSeen < PAGE_OPENED ? null : T("{train} arrived at {place}.", { train: trainLabel(rec), place: rec.stopName }));
    } else if (now - (rec.lastSeen || 0) > LOST_MS) {
      untrack(rec.id, rec.lastSeen < PAGE_OPENED ? null
        : T("Stopped tracking {train}: it hasn't reported for 30 minutes, so its trip may have finished or been cancelled.", { train: trainLabel(rec) }));
    }
  }
  if (changed) saveTracked();
}

// Tracking a train: to the stop chosen (or its last). A rider who says
// they're riding it names where they got on (the sheet, or their planned
// trip); only rides go to their trips, and only once it's clear they took it
// (finishRide).
function startTracking(t, stopKey, { fromKey = null, riding = false, confirmed = false } = {}) {
  if (state.tracked.some((r) => r.id === t.id)) return;
  if (state.tracked.length >= MAX_TRACKED) return toast(T("You can track up to three trains at once."));
  const stop = stopKey ? t.stops?.find((s) => s.key === stopKey) : null;
  const from = riding ? (fromKey && t.stops?.find((s) => s.key === fromKey)) || boardingGuess(t) : null;
  state.tracked.push({
    id: t.id, agency: t.agency, number: t.number, route: t.route,
    stopKey: stop?.key || null, stopName: stop?.name || null,
    eta: stop ? Date.parse(stop.time) : null, lastSeen: Date.now(),
    riding, confirmed,
    ...rideFrom(from && from !== stop ? from : null),
  });
  saveTracked();
  checkTracked();
  applySelectionFilter();
  renderAll();
  refreshDetails();
}

const rideFrom = (s) => ({ fromKey: s?.key || null, fromName: s?.name || null, departAt: s ? Date.parse(s.dep || s.time) || null : null });
// Where a rider most likely got on, before they say: the stop the train is
// at or last left, or, before it has left, its first.
function boardingGuess(t) {
  const stops = t.stops || [];
  return [...stops].reverse().find((s) => s.here || s.status === "past") || stops[0] || null;
}
// Today's planned trip on this train, if the rider has one.
const plannedTrip = (t) => account?.upcoming?.()?.find((r) => r.service_date === account.today() && r.agency === t.agency && r.number && String(r.number) === String(t.number)) || null;
const stopOfTrip = (t, key, name) => t.stops?.find((s) => s.key && ((key && s.key === key) || (name && fold(s.name) === fold(name)))) || null;

// A ride reached its stop. Its location matched the train along the way:
// it goes to the rider's trips. Otherwise they're asked (an island) first.
// Trains only watched never do.
function finishRide(rec, arrivedAt) {
  if (rec.riding === false || !account?.user) return;
  if (rec.confirmed) {
    account.logRide(rec, arrivedAt);
    return toast(T("Added to your trips."));
  }
  state.rideAsks = [{ rec: { ...rec }, arrivedAt, at: Date.now() }, ...state.rideAsks.filter((a) => a.rec.id !== rec.id)].slice(0, 3);
  store.set("tt-ride-asks", state.rideAsks);
}
const RIDE_ASK_MS = 3 * 86400000; // an unanswered "Were you on it?" goes away after this
function rideAskCards() {
  state.rideAsks = state.rideAsks.filter((a) => Date.now() - a.at < RIDE_ASK_MS);
  return state.rideAsks.map(({ rec }) => {
    const a = AGENCIES[rec.agency] || { color: "#888", short: "" };
    const leg = [rec.fromName, rec.stopName].filter(Boolean).join(" → ");
    return `<div class="track-card live guess ask" style="--c:${a.color}" data-ride-ask="${esc(rec.id)}">
      <div class="la-top">${plate(rec.number || a.short, a.color, "xs")}<span class="la-route">${esc(T("Were you on {train}?", { train: rec.route || trainLabel(rec) }))}</span></div>
      ${leg ? `<div class="la-where">${esc(leg)}</div>` : ""}
      <div class="ask-actions"><button type="button" class="guess-go" data-ask-yes>${T("Yes, add it to my trips")}</button><button type="button" class="ask-no" data-ask-no>${T("No")}</button></div>
    </div>`;
  }).join("");
}
function answerRideAsk(id, yes) {
  const ask = state.rideAsks.find((a) => a.rec.id === id);
  state.rideAsks = state.rideAsks.filter((a) => a.rec.id !== id);
  store.set("tt-ride-asks", state.rideAsks);
  if (ask && yes) loadAccount().then((a) => {
    a?.logRide(ask.rec, ask.arrivedAt);
    toast(T("Added to your trips."));
  });
  renderTracked();
}

// While a ride is tracked, where the rider's location is already allowed,
// a look every few minutes for whether they're with the train: once they
// are, the ride goes to their trips without asking. The position stays on
// the device.
const RIDE_CHECK_MS = 3 * 60 * 1000;
let rideCheckAt = 0;
function checkRiding() {
  const open = state.tracked.filter((r) => r.riding && !r.confirmed && trackedTrain(r));
  if (!open.length || !navigator.geolocation || Date.now() - rideCheckAt < RIDE_CHECK_MS || document.hidden) return;
  rideCheckAt = Date.now();
  navigator.permissions?.query({ name: "geolocation" }).then((p) => {
    if (p.state !== "granted") return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const fix = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      let changed = false;
      for (const rec of open) {
        const t = trackedTrain(rec), p = t && (state.display.get(t.id) || targetOf(t));
        if (p && meters(fix, p) < 1500 + Math.min(pos.coords.accuracy || 0, 1000)) {
          rec.confirmed = true;
          changed = true;
        }
      }
      if (changed) saveTracked();
    }, () => {}, { enableHighAccuracy: false, maximumAge: 60000, timeout: 20000 });
  }).catch(() => {});
}

function untrack(id, message) {
  state.tracked = state.tracked.filter((r) => r.id !== id);
  saveTracked();
  applySelectionFilter();
  if (message) toast(message);
  renderAll();
}

// Under the train's name: one button. Not tracked: "Track", which opens
// the sheet asking where you're getting off (a train with no stops ahead
// listed is tracked to the end at once). Tracked: "Tracking to Manassas",
// which opens the same sheet to change the stop or stop tracking.
const BELL_ICON = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M12 3.5a5 5 0 0 0-5 5v3.2l-1.6 2.9A1 1 0 0 0 6.3 16h11.4a1 1 0 0 0 .9-1.4L17 11.7V8.5a5 5 0 0 0-5-5ZM9.8 18.5a2.3 2.3 0 0 0 4.4 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function trackButton(t) {
  const rec = state.tracked.find((r) => r.id === t.id);
  if (rec) {
    return `<button type="button" class="btn small tracking-btn" data-track="${esc(t.id)}">${BELL_ICON}${esc(rec.stopName ? T("Tracking to {to}", { to: rec.stopName }) : T("Tracking"))}</button>`;
  }
  return `<button type="button" class="btn primary small track-btn" data-track="${esc(t.id)}">${BELL_ICON}${T("Track")}</button>`;
}

// The stops still ahead, for the sheet: the one it's at or coming to next,
// and every one after.
const stopsAhead = (t) => (t.stops || []).filter((s) => s.status !== "past" && s.key);

function openTrackSheet(t, { riding = null, confirmed = false } = {}) {
  const left = stopsAhead(t);
  const rec = state.tracked.find((r) => r.id === t.id);
  if (!left.length) {
    if (rec) return untrack(t.id);
    return startTracking(t, null);
  }
  // A planned trip on this train today names both stops.
  const trip = plannedTrip(t);
  const planned = trip && stopOfTrip(t, trip.to_key, trip.to_name);
  const chosen = rec?.stopKey && left.some((s) => s.key === rec.stopKey) ? rec.stopKey
    : planned && left.includes(planned) ? planned.key : left[left.length - 1].key;
  const from = rec?.fromKey || (trip && stopOfTrip(t, trip.from_key, trip.from_name)?.key) || boardingGuess(t)?.key || null;
  state.trackSheet = { id: t.id, key: chosen, from, riding: canRide() && (rec ? rec.riding !== false : riding ?? true), confirmed };
  renderTrackSheet();
}
// Rides go to the rider's trips: offered only when they're signed in.
const canRide = () => Boolean(account?.user);
function closeTrackSheet() {
  if (!state.trackSheet) return;
  state.trackSheet = null;
  renderTrackSheet();
}
// "Where are you getting off?": the stops ahead, the train's last one
// chosen to begin with; Start tracking (or, once tracked, Done and Stop
// tracking). Drawn over the train's page.
function renderTrackSheet() {
  const el = $("track-sheet");
  if (!el) return;
  const sh = state.trackSheet, t = sh && state.trains.get(sh.id);
  if (!t || state.selected !== t.id) {
    if (state.trackSheet && !t) state.trackSheet = null;
    el.hidden = true;
    el.innerHTML = "";
    return;
  }
  const rec = state.tracked.find((r) => r.id === t.id);
  const offAt = (t.stops || []).findIndex((s) => s.key === sh.key);
  const boardable = (t.stops || []).filter((s, i) => s.key && (offAt < 0 || i < offAt));
  const ride = canRide() ? `<div class="segmented two ts-mode" role="radiogroup">
      <button type="button" data-sheet-riding="1" aria-pressed="${sh.riding}">${T("I'm riding it")}</button>
      <button type="button" data-sheet-riding="0" aria-pressed="${!sh.riding}">${T("Just watching")}</button></div>` +
    (sh.riding ? `<label class="ts-from"><span>${T("Got on at")}</span><select data-sheet-from>${boardable.map((s) =>
      `<option value="${esc(s.key)}"${s.key === sh.from ? " selected" : ""}>${esc(s.name)}${s.time ? ` · ${esc(fmtTime(s.dep || s.time, s.tz))}` : ""}</option>`).join("")}</select></label>` : "") : "";
  const rows = stopsAhead(t).map((s) => {
    const on = s.key === sh.key;
    return `<button type="button" class="ts-stop${on ? " on" : ""}" role="radio" aria-checked="${on}" data-sheet-stop="${esc(s.key)}">
      <span class="ts-check" aria-hidden="true"></span><span class="ts-name">${esc(s.name)}</span><span class="ts-time">${s.time ? esc(fmtTime(s.time, s.tz)) : ""}</span></button>`;
  }).join("");
  el.hidden = false;
  el.innerHTML = `<div class="ts-scrim" data-sheet-close></div>
    <div class="ts-card" role="dialog" aria-modal="true" aria-labelledby="ts-title">
      <div class="ts-head"><h3 id="ts-title">${T(sh.riding || !canRide() ? "Where are you getting off?" : "Track it until")}</h3><button type="button" class="tc-x ts-x" data-sheet-close aria-label="${T("Close")}">×</button></div>
      ${ride}
      <div class="ts-list" role="radiogroup" aria-labelledby="ts-title">${rows}</div>
      <div class="ts-actions">
        ${rec ? `<button type="button" class="btn small" data-sheet-untrack>${T("Stop tracking")}</button>` : ""}
        <button type="button" class="btn primary" data-sheet-start>${T(rec ? "Done" : "Start tracking")}</button>
      </div>
    </div>`;
  el.querySelector(".ts-stop.on")?.scrollIntoView({ block: "nearest" });
  el.querySelector(".ts-stop.on")?.focus({ preventScroll: true });
}
function startFromSheet() {
  const sh = state.trackSheet, t = sh && state.trains.get(sh.id);
  state.trackSheet = null;
  renderTrackSheet();
  if (!t) return;
  const rec = state.tracked.find((r) => r.id === t.id);
  if (!rec) return startTracking(t, sh.key, { fromKey: sh.from, riding: sh.riding, confirmed: sh.confirmed });
  const stop = t.stops?.find((s) => s.key === sh.key);
  const from = sh.riding ? t.stops?.find((s) => s.key === sh.from) || boardingGuess(t) : null;
  Object.assign(rec, { stopKey: stop?.key || null, stopName: stop?.name || null, eta: stop ? Date.parse(stop.time) : null, riding: sh.riding, ...rideFrom(from) });
  saveTracked();
  checkTracked();
  renderAll();
}
on("track-sheet", "click", (e) => {
  if (e.target.closest("[data-sheet-close]")) return closeTrackSheet();
  const row = e.target.closest("[data-sheet-stop]");
  if (row && state.trackSheet) {
    state.trackSheet.key = row.dataset.sheetStop;
    for (const b of document.querySelectorAll("#track-sheet .ts-stop")) {
      const on = b === row;
      b.classList.toggle("on", on);
      b.setAttribute("aria-checked", String(on));
    }
    return;
  }
  const mode = e.target.closest("[data-sheet-riding]");
  if (mode && state.trackSheet) {
    state.trackSheet.riding = mode.dataset.sheetRiding === "1";
    return renderTrackSheet();
  }
  if (e.target.closest("[data-sheet-start]")) return startFromSheet();
  if (e.target.closest("[data-sheet-untrack]")) {
    const id = state.trackSheet?.id;
    closeTrackSheet();
    if (id) untrack(id);
  }
});
on("track-sheet", "change", (e) => {
  if (e.target.matches("[data-sheet-from]") && state.trackSheet) state.trackSheet.from = e.target.value;
});
on("track-sheet", "keydown", (e) => {
  if (e.key === "Escape") { e.stopPropagation(); return closeTrackSheet(); }
  // Up and down move the choice, as in a list of radio buttons.
  if ((e.key === "ArrowDown" || e.key === "ArrowUp") && e.target.closest(".ts-stop")) {
    e.preventDefault();
    const all = [...document.querySelectorAll("#track-sheet .ts-stop")];
    const next = all[all.indexOf(e.target.closest(".ts-stop")) + (e.key === "ArrowDown" ? 1 : -1)];
    if (next) { next.click(); next.focus(); }
  }
});

function renderTracked() {
  const el = $("tracked");
  if (!el) return;
  const guess = rideGuessCard() + rideAskCards();
  el.hidden = !state.tracked.length && !guess;
  el.innerHTML = guess + state.tracked.map((rec) => {
    const t = trackedTrain(rec);
    const a = AGENCIES[rec.agency] || { color: "#888", short: "" };
    let where = "", status = "", warn = "";
    if (t) {
      const chosen = rec.stopKey && t.stops?.find((s) => s.key === rec.stopKey);
      const next = !chosen && (t.stops?.find((s) => s.status === "next") || t.stops?.find((s) => s.status === "future"));
      const stop = chosen || next;
      if (stop) {
        const time = Date.parse(stop.time);
        where = `${chosen ? "" : `${T("Next:")} `}<strong>${esc(stop.name)}</strong>${time ? ` · ${fmtTime(stop.time, stop.tz)} · ${fmtIn(time) === T("now") ? T("now") : T("in {time}", { time: fmtIn(time) })}` : ""}`;
      } else if (t.nextStop) {
        where = `${T("Next:")} <strong>${esc(t.nextStop)}</strong>`;
      } else if (t.destination) {
        where = `${T("to")} <strong>${esc(t.destination)}</strong>`;
      }
      const late = lateText(t.delayMin);
      if (late.text) status = `<span class="status ${late.cls}${t.inferred ? " inferred" : ""}"${t.inferred ? ` title="${INFERRED_TITLE}"` : ""}>${late.text}</span>`;
      const end = (rec.stopKey && t.stops?.find((s) => s.key === rec.stopKey)) || t.stops?.[t.stops.length - 1];
      const guess = end && likelyDelays(t)?.get(end.key);
      if (guess && !guess.usual) status += `${status ? " · " : ""}<span class="status ${lateText(guess.min).cls}">${esc(likelyText(guess.min))}</span>`;
      if (Date.now() - t.updated > STALE_MS && !t.estimated) warn = `<span class="stale">⚠ ${T("Position {ago}", { ago: fmtAgo(t.updated) })}</span>`;
    } else {
      where = rec.stopName ? `${T("to")} <strong>${esc(rec.stopName)}</strong>` : "";
      warn = `<span class="stale">${T("Not reporting · last seen {ago}", { ago: fmtAgo(rec.lastSeen) })}</span>`;
    }
    // Live Activity: a countdown to the stop it's tracked to.
    let eta = "";
    if (t?.stops?.length) {
      const dest = (rec.stopKey && t.stops.find((s) => s.key === rec.stopKey)) || t.stops[t.stops.length - 1];
      const end = Date.parse(dest.time);
      const min = end ? Math.round((end - Date.now()) / 60000) : null;
      if (min != null) eta = min <= 0 ? T("Now") : min < 60 ? `${min}<small>min</small>` : `${Math.floor(min / 60)}<small>h</small> ${min % 60}<small>m</small>`;
    }
    const color = t?.routeColor || a.color;
    return `<div class="track-card live" style="--c:${color}" role="button" tabindex="0" data-track-open="${esc(rec.id)}">
      <div class="la-top">${plate(rec.number || a.short, a.color, "xs")}<span class="la-route">${esc(rec.route || AGENCIES[rec.agency]?.name || "")}</span>${eta ? `<span class="la-eta">${eta}</span>` : ""}
        <button class="tc-x tc-share" data-share-ride="${esc(rec.id)}" aria-label="${T("Share this ride")}" title="${T("Share this ride")}">${SHARE_ICON}</button>
        <button class="tc-x" data-untrack="${esc(rec.id)}" aria-label="${esc(T("Stop tracking {train}", { train: trainLabel(rec) }))}" title="${T("Stop tracking")}">×</button></div>
      ${where || status || warn ? `<div class="la-where">${[where, status, warn].filter(Boolean).join(" · ")}</div>` : ""}
    </div>`;
  }).join("");
  // A train just tracked grows out of a pill, like the Dynamic Island. A
  // redraw midway picks the animation up where it was.
  const now = Date.now();
  const keyOf = (card) => card.dataset.trackOpen || (card.dataset.rideAsk ? `ask:${card.dataset.rideAsk}` : `guess:${card.dataset.rideGuess}`);
  for (const card of el.children) {
    const since = now - (islandsShown.get(keyOf(card)) ?? now);
    if (since < 600) {
      card.classList.add("enter");
      card.style.setProperty("--enter-at", `${-since}ms`);
    }
  }
  islandsShown = new Map([...el.children].map((card) => [keyOf(card), islandsShown.get(keyOf(card)) ?? now]));
  // On phones, keep the cards visible when the sheet is collapsed.
  document.documentElement.style.setProperty("--tracked-h", `${el.hidden || !isPhone ? 0 : el.offsetHeight}px`);
}

// Share a tracked ride: a link that, opened, tracks the same train to the
// same stop (from the same one), with a line saying where it's going.
const SHARE_ICON = '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M12 3.5v11M8 7.5l4-4 4 4M7 11H6a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 18 11h-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
async function shareRide(rec) {
  if (!rec) return;
  const q = new URLSearchParams({ train: rec.id, ride: "1" });
  if (rec.stopKey) q.set("to", rec.stopKey);
  const url = `${location.origin}${location.pathname}?${q}`;
  const name = trainLabel(rec), when = rec.eta ? fmtTime(new Date(rec.eta).toISOString()) : "";
  const text = rec.stopName && when ? T("I'm on {train}, arriving at {place} at {time}.", { train: name, place: rec.stopName, time: when })
    : T("I'm on {train}.", { train: name });
  if (navigator.share) {
    try {
      return await navigator.share({ title: name, text, url });
    } catch (err) {
      if (err.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    toast(T("Link copied."));
  } catch {
    toast(url);
  }
}

// ---------- Which train am I on? ----------
// Pressing locate while riding: if the rider is moving at train speed and a
// train on the map is where they are, going their way (and about as fast,
// where it reports a speed), Trainsheet offers to track it. One fix rarely
// has a speed, so fixes are watched for up to 30 seconds after the press.
// Nothing is kept or sent anywhere.
const RIDE_MIN_MPS = 6.7;    // 15 mph: slower than this isn't riding a train
const RIDE_WATCH_MS = 30000;
const RIDE_GUESS_MS = 10 * 60 * 1000; // an unanswered guess goes away after this
const MPS_PER_MPH = 0.44704;
let rideWatch = null;                 // { id, timer, fixes }
const rideDismissed = new Set();      // trains the rider said they're not on, this visit

function watchRide() {
  if (rideWatch || !navigator.geolocation) return;
  rideWatch = { fixes: [], timer: setTimeout(stopRideWatch, RIDE_WATCH_MS) };
  rideWatch.id = navigator.geolocation.watchPosition(onRideFix, stopRideWatch, { enableHighAccuracy: true, maximumAge: 0, timeout: RIDE_WATCH_MS });
}
function stopRideWatch() {
  if (!rideWatch) return;
  navigator.geolocation.clearWatch(rideWatch.id);
  clearTimeout(rideWatch.timer);
  rideWatch = null;
}
const compassBearing = (a, b) => {
  const r = Math.PI / 180, y = Math.sin((b.lon - a.lon) * r) * Math.cos(b.lat * r);
  const x = Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos((b.lon - a.lon) * r);
  return (Math.atan2(y, x) / r + 360) % 360;
};
function onRideFix(pos) {
  const c = pos.coords, w = rideWatch;
  if (!w || !(c.accuracy <= 500)) return;
  const fix = { lat: c.latitude, lon: c.longitude, at: pos.timestamp || Date.now(), acc: c.accuracy };
  w.fixes.push(fix);
  // Speed and heading as the device reports them, else from the first fix.
  let speed = Number.isFinite(c.speed) ? c.speed : null, heading = Number.isFinite(c.heading) && speed > 1 ? c.heading : null;
  const first = w.fixes[0], secs = (fix.at - first.at) / 1000, moved = meters(first, fix);
  if (speed == null && secs >= 4) speed = moved / secs;
  if (heading == null && secs >= 4 && moved > 30) heading = compassBearing(first, fix);
  if (speed == null || speed < RIDE_MIN_MPS) return;
  const t = trainHere(fix, speed, heading);
  if (!t) return;
  stopRideWatch();
  state.rideGuess = { id: t.id, mph: speed / MPS_PER_MPH, at: Date.now() };
  renderTracked();
}
// The train nearest the rider that could be the one they're on. A train's
// position can be a minute or two old, so the rider may be that much
// further along.
function trainHere(fix, speed, heading) {
  let best = null;
  for (const t of state.trains.values()) {
    if (!inLists(t) || rideDismissed.has(t.id) || state.tracked.some((r) => r.id === t.id)) continue;
    const p = state.display.get(t.id) || targetOf(t);
    const age = Math.min(120, Math.max(0, (Date.now() - (t.fixAt || t.updated || Date.now())) / 1000));
    const allowed = Math.min(3000, 400 + fix.acc + age * speed);
    const d = meters(fix, p);
    if (d > allowed) continue;
    const b = t.bearing ?? state.est.get(t.id)?.bearing;
    if (heading != null && b != null && Math.abs(((heading - b) % 360 + 540) % 360 - 180) > 50) continue;
    if (t.speedMph != null && !t.estimated && Math.abs(t.speedMph * MPS_PER_MPH - speed) > Math.max(4.5, 0.35 * speed)) continue;
    if (!best || d / allowed < best.score) best = { t, score: d / allowed };
  }
  return best?.t || null;
}
// The guess, as an island over the tracked trains: track it, or say no.
function rideGuessCard() {
  const g = state.rideGuess, t = g && state.trains.get(g.id);
  if (!t || Date.now() - g.at > RIDE_GUESS_MS || state.tracked.some((r) => r.id === t.id)) {
    state.rideGuess = null;
    return "";
  }
  const a = AGENCIES[t.agency], km = unitsOf(t.agency) === "km";
  const speed = `${Math.round(km ? g.mph * KM_PER_MI : g.mph)} ${km ? "km/h" : T("mph")}`;
  const next = t.stops?.find((s) => s.status === "next")?.name || t.nextStop;
  return `<div class="track-card live guess" style="--c:${t.routeColor || a.color}" data-ride-guess="${esc(t.id)}">
      <div class="la-top">${plate(t.number || a.short, a.color, "xs")}<span class="la-route">${esc(T("Are you on this train?"))}</span>
        <button class="tc-x" data-ride-no aria-label="${T("Not this train")}" title="${T("Not this train")}">×</button></div>
      <div class="la-where">${esc(T("Moving with you at {speed}", { speed }))}${next ? ` · ${T("Next:")} <strong>${esc(next)}</strong>` : ""}</div>
      <button type="button" class="guess-go" data-ride-yes>${T("Track this ride")}</button>
    </div>`;
}
function answerRideGuess(id, answer) {
  const t = state.trains.get(id);
  state.rideGuess = null;
  if (answer === "no") rideDismissed.add(id);
  if (!t || answer === "no") return renderTracked();
  if (answer === "open") { renderTracked(); return select(id); }
  // With stops ahead, the sheet asks where they're getting off; otherwise
  // it's tracked to the end.
  renderTracked();
  select(id);
  openTrackSheet(t, { riding: true, confirmed: true }); // found by the rider's own location
}

function openTracked(id) {
  const t = state.trains.get(id);
  if (!t) return toast(T("That train isn't reporting right now."));
  select(id);
}

setInterval(() => {
  if (document.hidden) return;
  checkTracked();
  renderTracked(); // ETAs count down between feed updates
  if (state.tab === "trips" && !state.selected && !state.station && !state.railroad) renderAgencies(); // and the next trip's
}, 30000);

function renderAll() {
  renderTracked();
  renderAgencies();
  renderResults();
  renderCredits();
  if (state.selected || state.station || state.railroad) renderDetail();
  // A line opened before its trains loaded is traced once they have.
  if (state.railroad && focusCache.key !== `${state.railroad}|${state.line || ""}|${state.line ? lineColor(state.railroad, state.line) : AGENCIES[state.railroad].color}`) applyFocus();
}


// ---------- Selection ----------

let stationsShownFor = null; // railroad whose stations alone show (its pages)
function applySelectionFilter() {
  if (!map.getLayer("tt-trains")) return;
  const id = state.selected || "", sid = state.station || "";
  // The selected train and every tracked train get a ping, and their plates
  // win any collision and show at every zoom. Only the selected train's
  // marker is enlarged; tracked trains keep their normal size.
  const ids = [...new Set([id, ...state.tracked.map((r) => r.id)].filter(Boolean))];
  const highlighted = ["in", ["get", "id"], ["literal", ids]];
  const selected = ["==", ["get", "id"], id];
  map.setFilter("tt-ping", highlighted);
  redraw(); // the selected train alone while one is open (visible())
  redrawRoute();
  map.setLayoutProperty("tt-labels", "text-variable-anchor-offset", plateOffset(selected));
  map.setFilter("tt-labels", state.labels === "none" ? highlighted : ["any", highlighted, ["all", [">=", ["zoom"], 8], [">=", ["zoom"], ["get", "z"]]]]);
  map.setLayoutProperty("tt-labels", "symbol-sort-key", ["case", highlighted, -1, ["get", "labelOrder"]]);
  for (const l of ["tt-station-ping", "tt-station-shadow", "tt-station-selected", "tt-footprint-selected"]) {
    map.setFilter(l, ["==", ["get", "id"], sid]);
  }
  applyStationCallouts();
  applyFocus();
  // Stations are filtered to the railroad on its pages.
  const only = state.railroad || null;
  if (only !== stationsShownFor) {
    stationsShownFor = only;
    redrawStations();
  }
  ping(Boolean(ids.length || sid));
  // Which trains show can depend on the selection and tracking (visible()).
  redraw();
}

// A circle that grows and fades from the selected train or station, then
// rests (hidden, back at the small size) before the next one. A still circle
// if motion is reduced.
let pingRaf = null;
const PING_MS = 1300, PING_REST_MS = 600;
function ping(on) {
  cancelAnimationFrame(pingRaf);
  const layers = ["tt-ping", "tt-station-ping"].filter((l) => map.getLayer(l));
  if (!on || !layers.length) return;
  // Pings start at the marker's edge; the selected train's marker is enlarged.
  const disc = () => discRadiusAt(map.getZoom());
  const radius = (l, extra) => l === "tt-ping"
    ? ["case", ["==", ["get", "id"], state.selected || ""], disc() * SELECTED_SCALE + extra, disc() + extra]
    : disc() + extra;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (const l of layers) {
      map.setPaintProperty(l, "circle-radius", radius(l, 6));
      map.setPaintProperty(l, "circle-opacity", 0.25);
    }
    return;
  }
  // While none of the pinged markers is on screen (a train tracked from
  // across the map, the page panned away from it), the ping isn't drawn, so
  // the repaint it costs the map every frame is skipped until one comes back.
  const onScreen = () => {
    const spots = [];
    for (const id of new Set([state.selected, ...state.tracked.map((r) => r.id)])) {
      const t = id && state.trains.get(id);
      if (t) spots.push(state.display.get(id) || targetOf(t));
    }
    const st = state.station && state.stations.get(state.station);
    if (st) spots.push(st);
    if (!spots.length) return true;
    const { clientWidth: w, clientHeight: h } = map.getContainer();
    const reach = disc() * SELECTED_SCALE + 18 + 2; // the ping at its largest
    return spots.some((s) => { const p = map.project([s.lon, s.lat]); return p.x > -reach && p.x < w + reach && p.y > -reach && p.y < h + reach; });
  };
  let last = 0;
  const step = (now) => {
    if (now - last > 33 && !document.hidden && onScreen()) {
      last = now;
      const t = now % (PING_MS + PING_REST_MS);
      const resting = t > PING_MS;
      const k = resting ? 0 : t / PING_MS;
      const grow = 1 - (1 - k) ** 3; // ease out
      const opacity = resting ? 0 : 0.4 * (1 - k) ** 1.5;
      for (const l of layers) {
        map.setPaintProperty(l, "circle-radius", radius(l, grow * 18));
        map.setPaintProperty(l, "circle-opacity", opacity);
      }
    }
    pingRaf = requestAnimationFrame(step);
  };
  pingRaf = requestAnimationFrame(step);
}

function setUrlSelection() {
  const url = new URL(location.href);
  url.searchParams.delete("train");
  url.searchParams.delete("station");
  url.searchParams.delete("railroad");
  url.searchParams.delete("line");
  if (state.selected) url.searchParams.set("train", state.selected);
  if (state.railroad) url.searchParams.set("railroad", state.railroad);
  if (state.line) url.searchParams.set("line", state.line);
  if (state.station) url.searchParams.set("station", state.station);
  history.replaceState(null, "", url);
}

function showDetailView(open) {
  if (open) putPanelAway(false);
  if (!open && $("view-list").hidden) pageIn($("agencies"));
  if (!open) pageKeys.delete($("train-detail")); // the next page opened comes in anew
  $("view-list").hidden = open;
  $("view-train").hidden = !open;
  $("follow-btn").hidden = !state.selected;
  $("share-btn").hidden = !state.selected;
  delete $("train-detail").dataset.scrollTop;
  $("train-detail").scrollTop = 0;
}

function select(id, { fly = true } = {}) {
  const opened = id && state.trains.get(id);
  if (opened) remember({ kind: "train", id, agency: opened.agency, name: trainTitle(opened), number: opened.number || "" });
  if (opened) needData(opened.agency); // its stops' stations, abroad
  state.returnTo = null;
  if (state.trackSheet?.id !== id) closeTrackSheet();
  state.railroad = null;
  state.line = null;
  setBack(T("All trains"));
  if (state.selected !== id) state.car = null;
  state.selected = id;
  state.station = null;
  state.predictions = null;
  setUrlSelection();
  applySelectionFilter();
  showDetailView(!!id);
  if (!id) {
    setFollow(false);
    renderAll();
    return;
  }
  renderDetail();
  refreshDetails();
  const t = state.trains.get(id);
  if (t && fly) {
    map.flyTo({
      center: [targetOf(t).lon, targetOf(t).lat], // where it's drawn (on the track)
      zoom: Math.max(map.getZoom(), 9),
      padding: panelPadding(),
      duration: 900,
    });
  }
  if (isPhone) setSheet("");
}

let predictionTimer;
async function refreshPredictions(st) {
  const place = st.members.find((m) => m.agency === "mbta");
  if (!place || state.station !== st.id) return;
  try {
    state.predictions = await mbtaPredictions(place.id);
  } catch {
    state.predictions = [];
  }
  if (state.station === st.id) renderDetail();
}
// A station's notices, and its NJ Transit departure board for the tracks
// (through the relay).
async function refreshStationExtras(st) {
  loadUsualTracks(st);
  const njt = st.members.find((m) => m.agency === "njt" && m.code);
  const mbta = st.members.find((m) => m.agency === "mbta");
  const amtrak = st.members.find((m) => m.agency === "amtrak");
  const [notices, board, facilities, address, lifts] = await Promise.all([
    stationNotices(st).catch(() => []),
    njt && RELAY ? fetch(`${RELAY.replace(/\/$/, "")}/njt-board/${encodeURIComponent(njt.code)}`).then((r) => (r.ok ? r.json() : null)).catch(() => null) : null,
    mbta ? mbtaFacilities(mbta.id).catch(() => null) : null,
    amtrak ? amtrakAddress(amtrak.code || amtrak.id).catch(() => null) : null,
    stationLifts(st, RELAY).catch(() => null),
  ]);
  if (state.station !== st.id) return;
  const tracks = new Map((board?.items || []).filter((x) => x.track).map((x) => [String(x.trainID), x.track]));
  state.stationExtras = { id: st.id, notices, tracks, facilities, address, lifts };
  renderDetail();
}

function selectStation(id, { fly = true } = {}) {
  const openedSt = state.stations.get(id);
  if (openedSt) remember({ kind: "station", id, agency: openedSt.agencies[0], name: openedSt.name });
  const st = state.stations.get(id);
  // A station abroad (a recent one) opens once its region is in.
  if (!st) return void needData(String(id).split(":")[0])?.then(() => state.stations.has(id) && selectStation(id, { fly }));
  state.selected = null;
  state.railroad = null;
  state.line = null;
  state.station = id;
  state.predictions = null;
  setFollow(false);
  setUrlSelection();
  applySelectionFilter();
  showDetailView(true);
  renderDetail();
  clearInterval(predictionTimer);
  if (state.stationExtras?.id !== id) state.stationExtras = null;
  refreshStationExtras(st);
  if (st.agencies.includes("mbta")) refreshPredictions(st);
  predictionTimer = setInterval(() => {
    if (st.agencies.includes("mbta")) refreshPredictions(st);
    refreshStationExtras(st);
  }, 30000);
  if (fly) {
    map.flyTo({ center: [stationPos(st).lon, stationPos(st).lat], zoom: Math.max(map.getZoom(), 12), padding: panelPadding(), duration: 900 });
  }
  if (isPhone) setSheet("");
}

function closeDetail() {
  goingBack = true;
  try {
    return closeDetailTo();
  } finally {
    goingBack = false;
  }
}
function closeDetailTo() {
  clearInterval(predictionTimer);
  closeTrackSheet();
  const back = state.returnTo;
  state.returnTo = null;
  setBack(T("All trains"));
  // Back to the station a train was opened from, or the train a station was,
  // or the railroad page either was.
  if (back?.railroad && !state.railroad) return openRailroad(back.railroad, { fly: false, line: back.line || null });
  // Back to the train a line or railroad page was opened from.
  if (state.railroad && back?.train && state.trains.has(back.train)) return select(back.train, { fly: false });
  // Back from a line's page to its railroad's.
  if (state.line) return openRailroad(state.railroad);
  if (state.selected && typeof back === "string" && state.stations.has(back)) return selectStation(back, { fly: false });
  if (state.station && back?.train && state.trains.has(back.train)) {
    state.station = null;
    return select(back.train, { fly: false });
  }
  state.station = null;
  state.railroad = null;
  state.line = null;
  state.car = null;
  select(null);
}

function panelPadding() {
  // Clear of the tracked trains' islands across the top of the map, too.
  const islands = $("tracked"), top = islands && !islands.hidden && !isPhone ? islands.getBoundingClientRect().bottom : 0;
  if (isPhone) {
    // Clear of the sheet, at the detent it's at (or headed for).
    return { bottom: sheetHeights()[sheetMode()], top: 0, left: 0, right: 0 };
  }
  // From where the panel (or, put away, the rail) sits, not where it is
  // mid-slide: offsetLeft and offsetWidth leave its transform out.
  const side = panelAway ? $("tabbar") : $("panel");
  return { left: side.offsetLeft + side.offsetWidth, top, bottom: 0, right: 0 };
}

function setFollow(on) {
  state.follow = on;
  $("follow-btn")?.setAttribute("aria-pressed", String(on));
}

// ---------- Events ----------

const canHover = matchMedia("(hover: hover)").matches;
const coarsePointer = matchMedia("(pointer: coarse)").matches;
const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, focusAfterOpen: false, offset: 14, className: "hover-card" });

// Hovering a track names the railroads that run on it.
const RAIL_LAYERS = ["tt-rail-0", "tt-rail-1", "tt-rail-2"];
map.on("mousemove", (e) => {
  if (!canHover || !map.getLayer("tt-rail-0")) return;
  const box = [[e.point.x - 3, e.point.y - 3], [e.point.x + 3, e.point.y + 3]];
  // A train or station under the pointer (or its callout) wins over the track.
  const over = ["tt-trains", ...STATION_LAYERS, "tt-station-selected-label"].filter((l) => map.getLayer(l));
  const near = [[e.point.x - 8, e.point.y - 8], [e.point.x + 8, e.point.y + 8]];
  if (hoverStation || map.queryRenderedFeatures(near, { layers: over }).some(shownAt)) {
    if (popup._railHover) popup.remove();
    popup._railHover = false;
    return;
  }
  const broken = map.getLayer("tt-disruption-gap") && map.queryRenderedFeatures(box, { layers: ["tt-disruption-gap"] })[0];
  if (broken) {
    popup.setLngLat(e.lngLat).setHTML(disruptionCard(broken.properties.id)).addTo(map);
    popup._railHover = true;
    return;
  }
  const rail = map.queryRenderedFeatures(box, { layers: RAIL_LAYERS })[0];
  if (!rail) {
    if (popup._railHover) popup.remove();
    popup._railHover = false;
    return;
  }
  const nets = ["a", "b", "c"].map((k) => rail.properties[k]).filter(Boolean);
  popup
    .setLngLat(e.lngLat)
    .setHTML(nets.map((n) => `<div class="rail-net"><span class="dot" style="background:${NETWORKS[n]?.color || "#8d95a3"}"></span>${esc(NETWORKS[n]?.name || T("Commuter rail"))}</div>`).join(""))
    .addTo(map);
  popup._railHover = true;
});

const STATION_LAYERS = ["tt-stations-major", "tt-stations-minor", "tt-station-labels", "tt-footprint-fill"];

// The station callout (its name in a tag above it) shows on the selected
// station and on the one under the pointer, so clicking a hovered station
// doesn't change its label. The callout replaces its plain label.
let hoverStation = null;
function applyStationCallouts() {
  if (!map.getLayer("tt-station-selected-label")) return;
  const ids = [state.station, hoverStation].filter(Boolean);
  map.setFilter("tt-station-selected-label", ["in", ["get", "id"], ["literal", ids]]);
  map.setFilter("tt-station-labels", ["all", [">=", ["zoom"], ["get", "lz"]], ["!", ["in", ["get", "id"], ["literal", ids]]]]);
}
function hoverStationTo(id) {
  if (id === hoverStation) return;
  hoverStation = id;
  if (id && popup._railHover) { popup.remove(); popup._railHover = false; } // the track's popup gives way
  applyStationCallouts();
}

// One click handler so a train sitting on a station wins over the station.
map.on("click", (e) => {
  // A finger's width on touch screens, a little less with a mouse; of the
  // trains under it, the nearest.
  const r = coarsePointer ? 22 : 10;
  const box = [[e.point.x - r, e.point.y - r], [e.point.x + r, e.point.y + r]];
  const nearest = (fs) => fs.map((f) => {
    const p = map.project(f.geometry.coordinates);
    return [f, (p.x - e.point.x) ** 2 + (p.y - e.point.y) ** 2];
  }).sort((a, b) => a[1] - b[1])[0]?.[0];
  const train = nearest(map.queryRenderedFeatures(box, { layers: ["tt-trains", "tt-labels"].filter((l) => map.getLayer(l)) }).filter(shownAt));
  if (train) return select(train.properties.id);
  const station = map.queryRenderedFeatures(box, { layers: [...STATION_LAYERS, "tt-station-selected-label"].filter((l) => map.getLayer(l)) }).find(shownAt);
  if (station) return selectStation(station.properties.id);
  // A disruption, tapped (phones have no hover): its card, until the next tap.
  const broken = map.getLayer("tt-disruption-gap") && map.queryRenderedFeatures([[e.point.x - 8, e.point.y - 8], [e.point.x + 8, e.point.y + 8]], { layers: ["tt-disruption-gap"] })[0];
  if (broken) {
    popup.setLngLat(e.lngLat).setHTML(disruptionCard(broken.properties.id)).addTo(map);
    popup._railHover = true;
    return;
  }
  if (popup._railHover) { popup.remove(); popup._railHover = false; }
  // A tap on the map itself puts the panel away, from whatever page is open
  // (unless it's closing Settings, which the same tap does).
  if (!$("settings-menu").hidden || document.querySelector(".acct-sheet, .keys-sheet")) return;
  if (state.selected || state.station || state.railroad) goHome();
  putPanelAway(true);
});

function goHome() {
  Object.assign(state, { returnTo: null, station: null, railroad: null, line: null, car: null });
  setFollow(false);
  closeDetail();
}

for (const layer of STATION_LAYERS) {
  map.on("mousemove", layer, (e) => {
    if (map.queryRenderedFeatures(e.point, { layers: ["tt-trains"] }).some(shownAt)) return;
    const f = e.features.find(shownAt);
    map.getCanvas().style.cursor = f ? "pointer" : "";
    if (canHover) hoverStationTo(f?.properties.id ?? null);
  });
  map.on("mouseleave", layer, () => {
    map.getCanvas().style.cursor = "";
    hoverStationTo(null);
  });
}

map.on("mousemove", "tt-trains", (e) => {
  const f = e.features.find(shownAt);
  map.getCanvas().style.cursor = f ? "pointer" : "";
  if (!canHover || !f) return;
  const t = state.trains.get(f.properties.id);
  if (!t) return;
  popup.setLngLat(f.geometry.coordinates);
  // Redrawn only when the train or its data changes: the cars are drawings.
  const key = `${t.id}|${t.updated}|${state.units}`;
  if (popup._ttKey !== key) {
    popup._ttKey = key;
    popup.setHTML(hoverCard(t));
  }
  if (!popup.isOpen()) popup.addTo(map);
});

// The card shown hovering a train on a computer: its plate and name, its
// cars, and its next stop and whether it's on time.
function hoverCard(t) {
  const a = AGENCIES[t.agency];
  const c = consistOf(t);
  const next = t.stops?.find((s) => s.status === "next") || t.stops?.find((s) => s.status === "future");
  const status = statusSpan(t, "status-t");
  const where = next
    ? `<span class="hc-k">${T("Next")}</span> <strong>${esc(next.name)}</strong>${next.time ? ` · ${esc(fmtTime(next.time, next.tz))}` : ""}`
    // Railroads that give only the next stop's name (SEPTA, GO...).
    : t.nextStop ? `<span class="hc-k">${T("Next")}</span> <strong>${esc(t.nextStop)}</strong>`
    : t.destination ? `${T("to")} <strong>${esc(t.destination)}</strong>` : "";
  return `<div class="t">${plate(t.number || a.short, a.color, "xs")}<span>${esc(trainTitle(t))}</span></div>
    ${c ? `<div class="hc-strip" aria-hidden="true">${consistHtml(c, a.color).replaceAll(' role="button" tabindex="0"', "")}</div>` : ""}
    ${where || status ? `<div class="s">${[where, status].filter(Boolean).join(" · ")}</div>` : ""}`;
}
map.on("mouseleave", "tt-trains", () => {
  map.getCanvas().style.cursor = "";
  popup._ttKey = null;
  popup.remove();
});

map.on("dragstart", () => state.follow && setFollow(false));

on("back-btn", "click", closeDetail);
on("tracked", "click", (e) => {
  const ask = e.target.closest("[data-ride-ask]");
  if (ask) {
    if (e.target.closest("[data-ask-yes]")) return answerRideAsk(ask.dataset.rideAsk, true);
    if (e.target.closest("[data-ask-no]")) return answerRideAsk(ask.dataset.rideAsk, false);
    return;
  }
  const guess = e.target.closest("[data-ride-guess]");
  if (guess) return answerRideGuess(guess.dataset.rideGuess, e.target.closest("[data-ride-no]") ? "no" : e.target.closest("[data-ride-yes]") ? "yes" : "open");
  const share = e.target.closest("[data-share-ride]");
  if (share) return shareRide(state.tracked.find((r) => r.id === share.dataset.shareRide));
  const x = e.target.closest("[data-untrack]");
  if (x) return untrack(x.dataset.untrack);
  const card = e.target.closest("[data-track-open]");
  if (card) openTracked(card.dataset.trackOpen);
});
on("tracked", "keydown", (e) => {
  const card = e.target.closest("[data-track-open]");
  if (card && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    openTracked(card.dataset.trackOpen);
  }
});

function openCar(fig) {
  const i = Number(fig.dataset.car);

  // On a line's page, the cars are its typical train's.
  const id = state.selected || (state.line ? fleetTrain(state.railroad, state.line).id : null);
  state.car = state.car?.id === id && state.car.i === i ? null : { id, i, page: false };
  renderDetail();
}
on("train-detail", "keydown", (e) => {
  const stationLi = e.target.closest?.("li[data-station]");
  if (stationLi && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); return stationLi.click(); }
  const stopLink = e.target.closest?.("[data-stop-station]");
  if (stopLink && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); return openStop(stopLink); }
  const foldRow = e.target.closest?.("[data-fold-past]");
  if (foldRow && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); return foldRow.click(); }
  const fig = e.target.closest?.("[data-car]");
  if (fig && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openCar(fig); }
});
function openStop(li) {
  const t = state.trains.get(state.selected);
  selectStation(li.dataset.stopStation);
  if (!t) return;
  state.returnTo = { train: t.id }; // "back" from this station goes to the train
  setBack(t.number ? T("Train {n}", { n: t.number }) : T("Train"));
}
on("train-detail", "click", (e) => {
  if (e.target.closest("[data-fold-past]")) {
    pastOpen.add(state.selected);
    return renderDetail();
  }
  const stopLink = e.target.closest("[data-stop-station]");
  if (stopLink) return openStop(stopLink);
  const view = e.target.closest("[data-station-view]");
  if (view) { state.stationView = view.dataset.stationView; return renderDetail(); }
  const fig = e.target.closest("[data-car]");
  if (fig) return openCar(fig);
  // A car in a railroad page's fleet: straight to its model page.
  const kind = e.target.closest("[data-fleet-car]");
  if (kind && state.railroad) {
    const { route, number, train, i } = kind.dataset;
    state.car = { id: `fleet:${state.railroad}`, i: Number(i), page: true, fleet: route, number: number || null, train: train || null };
    renderDetail();
    $("train-detail").scrollTop = 0;
    return;
  }
  if (e.target.closest("[data-car-close]")) { state.car = null; return renderDetail(); }
  if (e.target.closest("[data-model-more]") && state.car) { state.car.page = true; renderDetail(); $("train-detail").scrollTop = 0; return; }
  if (e.target.closest("[data-model-back]") && state.car) {
    if (state.car.fleet != null) state.car = null; // back to the railroad page
    else state.car.page = false;
    return renderDetail();
  }
  const lineBtn = e.target.closest("button[data-line]");
  if (lineBtn && state.railroad) return openLine(state.railroad, lineBtn.dataset.line);
  if (e.target.closest("[data-lifts-toggle]")) {
    state.liftsOpen = !state.liftsOpen;
    return renderDetail();
  }
  const servedToggle = e.target.closest("[data-served-toggle]");
  if (servedToggle) {
    const id = servedToggle.dataset.servedToggle;
    state.servedOpen.has(id) ? state.servedOpen.delete(id) : state.servedOpen.add(id);
    return renderDetail();
  }
  const openLineBtn = e.target.closest("[data-open-line]"), railroadBtn = e.target.closest("[data-railroad]");
  if (openLineBtn || railroadBtn) {
    const fromTrain = state.selected && state.trains.get(state.selected);
    if (openLineBtn) openLine(openLineBtn.dataset.lineRailroad, openLineBtn.dataset.openLine);
    else openRailroad(railroadBtn.dataset.railroad);
    // "back" from a line or railroad opened from a train goes to the train
    if (fromTrain) {
      state.returnTo = { train: fromTrain.id };
      setBack(fromTrain.number ? T("Train {n}", { n: fromTrain.number }) : T("Train"));
    }
    return;
  }
  const section = e.target.closest("[data-rr-section]");
  if (section) {
    const key = section.dataset.rrSection;
    state.rrCollapsed.has(key) ? state.rrCollapsed.delete(key) : state.rrCollapsed.add(key);
    store.set("tt-rr-collapsed", [...state.rrCollapsed]);
    return renderDetail();
  }
  if (e.target.closest("[data-notices-toggle]")) {
    state.noticesCollapsed = !state.noticesCollapsed;
    store.set("tt-notices-collapsed", state.noticesCollapsed);
    return renderDetail();
  }
  const track = e.target.closest("[data-track]");
  if (track) {
    const t = state.trains.get(track.dataset.track);
    if (t) openTrackSheet(t);
    return;
  }
  const stop = e.target.closest("[data-untrack]");
  if (stop) return untrack(stop.dataset.untrack);
  const b = e.target.closest("[data-select]");
  if (b) {
    const from = state.station, railroad = state.railroad, line = state.line;
    select(b.dataset.select);
    // "back" from this train goes to the station, railroad or line it was opened from
    state.returnTo = railroad ? { railroad, line } : from;
    setBack(railroad ? AGENCIES[railroad].short : from ? T("Station") : T("All trains"));
  }
  const st = e.target.closest("[data-station]");
  if (st) {
    const railroad = state.railroad, line = state.line;
    selectStation(st.dataset.station);
    if (railroad) {
      state.returnTo = { railroad, line };
      setBack(AGENCIES[railroad].short);
    }
  }
});
on("follow-btn", "click", () => {
  setFollow(!state.follow);
  const t = state.trains.get(state.selected);
  if (state.follow && t) map.easeTo({ center: [t.lon, t.lat], padding: panelPadding() });
});

// Share the open train: on a phone or tablet, the system's share sheet;
// on a computer (and with C), a link copied, the button showing a tick for
// a moment.
const copyIcon = $("share-btn").innerHTML;
const shareSheet = Boolean(navigator.share) && matchMedia("(pointer: coarse)").matches;
if (shareSheet) {
  $("share-btn").title = T("Share");
  $("share-btn").setAttribute("aria-label", T("Share"));
}
on("share-btn", "click", async (e) => {
  const t = state.trains.get(state.selected);
  if (!t) return;
  const btn = $("share-btn");
  const url = `${location.origin}${location.pathname}?train=${encodeURIComponent(t.id)}`;
  if (shareSheet && e.isTrusted) {
    try {
      return await navigator.share({ title: `${trainTitle(t)}${t.number ? ` ${t.number}` : ""}`, url });
    } catch (err) {
      if (err?.name === "AbortError") return; // closed without sharing
    }
  }
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    return toast(url);
  }
  toast(T("Link copied."));
  btn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  clearTimeout(btn._reset);
  btn._reset = setTimeout(() => { btn.innerHTML = copyIcon; }, 1500);
});

on("search", "input", (e) => {
  // A new search may be for a railroad off screen: every one is fetched
  // once, and every region's stations and timetables.
  if (!state.query.trim() && e.target.value.trim()) {
    wakeSources(true);
    dataRegions()?.then((m) => m?.loadAll());
  }
  state.query = e.target.value;
  renderResults();
  if (isPhone && state.query) setSheet("expanded");
});
on("filters", "change", (e) => {
  const key = e.target.dataset.filter;
  if (!key) return;
  // Filters may be for railroads off screen, as a search may.
  if (!filtersOn()) {
    wakeSources(true);
    dataRegions()?.then((m) => m?.loadAll());
  }
  state.filters[key] = e.target.value;
  renderResults();
  if (isPhone) setSheet("expanded");
});
on("filters", "click", (e) => {
  if (!e.target.closest("[data-filters-clear]")) return;
  state.filters = { kind: "", country: "", region: "", agency: "" };
  renderResults();
});
// Cancel (phones, while searching): the search is let go, and the sheet
// goes back to where it sits.
on("search-cancel", "click", () => {
  $("search").value = "";
  state.query = "";
  state.filters = { kind: "", country: "", region: "", agency: "" };
  $("search").blur();
  renderResults();
  if (isPhone) setSheet("");
});
on("search", "focus", () => { if (isPhone) setSheet("expanded"); });
on("search", "keydown", (e) => {
  if (e.key === "Enter") $("results").querySelector("[data-select]")?.click();
  if (e.key === "Escape") {
    e.target.value = "";
    state.query = "";
    renderResults();
  }
});

// Adding a train found in Browse to My trips: from one station to another,
// at once; a train running now or later today, by its trip's form, filled
// in from its first stop to its last, for the rider to set their own.
const withAccount = (fn) => loadAccount().then((a) => a && (a.user ? fn(a) : a.open("signin")));
function addFound(e) {
  const route = e.target.closest("[data-add-route], [data-route-pick]");
  if (route) {
    const r = routeShown?.trains[Number(route.dataset.addRoute ?? route.dataset.routePick)];
    if (!r) return true;
    const row = { agency: r.agency, number: r.number, route: r.route, service_date: routeShown.day,
      from_name: r.fromName, from_key: r.fromKey, to_name: r.toName, to_key: r.toKey, depart_at: r.departAt, arrive_at: r.arriveAt };
    withAccount((a) => (route.dataset.addRoute != null ? a.add(row) : a.addFrom(row)));
    return true;
  }
  const live = e.target.closest("[data-add-train]");
  if (live) {
    const t = state.trains.get(live.dataset.addTrain);
    if (!t) return true;
    const first = t.stops?.[0], last = t.stops?.[t.stops.length - 1];
    withAccount((a) => a.addFrom({ agency: t.agency, number: t.number, route: t.route || null, service_date: localDay(),
      from_name: first?.name || t.origin || null, from_key: first?.key || null, to_name: last?.name || t.destination || null, to_key: last?.key || null,
      depart_at: first?.scheduled || first?.time || null, arrive_at: last?.scheduled || last?.time || null }));
    return true;
  }
  const later = e.target.closest("[data-add-later]");
  if (later) {
    const u = laterShown.get(later.dataset.addLater);
    if (!u) return true;
    withAccount((a) => a.addFrom({ agency: u.id, number: u.number, route: u.line || null, service_date: localDay(u.at, u.tz),
      from_name: u.origin || null, to_name: u.dest || null, depart_at: new Date(u.at).toISOString() }));
    return true;
  }
  return false;
}
on("results", "change", (e) => {
  if (!e.target.matches("[data-route-date]") || !e.target.value) return;
  state.routeDay = e.target.value;
  renderResults();
});
on("results", "click", (e) => {
  if (addFound(e)) return;
  const day = e.target.closest("[data-route-day]");
  if (day) {
    state.routeDay = day.dataset.routeDay === localDay() ? null : day.dataset.routeDay;
    return renderResults();
  }
  // A train later today: show or hide its stops.
  const up = e.target.closest("[data-upcoming]");
  if (up) {
    state.upcomingOpen = state.upcomingOpen === up.dataset.upcoming ? null : up.dataset.upcoming;
    return renderResults();
  }
  // A car found by its number: its train, with the car's card open.
  const car = e.target.closest("[data-car-train]");
  if (car) {
    select(car.dataset.carTrain);
    if (car.dataset.carI !== "") {
      state.car = { id: car.dataset.carTrain, i: Number(car.dataset.carI) };
      renderDetail();
    }
    return;
  }
  const rr = e.target.closest("[data-railroad]");
  if (rr) return openRailroad(rr.dataset.railroad);
  const ln = e.target.closest("[data-open-line]");
  if (ln) return openLine(ln.dataset.lineRailroad, ln.dataset.openLine);
  const b = e.target.closest("[data-select]");
  const st = e.target.closest("[data-station]");
  if (b) select(b.dataset.select);
  else if (st) selectStation(st.dataset.station);
});

on("recents", "click", (e) => {
  if (e.target.closest("[data-recents-clear]")) {
    state.recents = [];
    store.set("tt-recents", []);
    return renderRecents();
  }
  const b = e.target.closest("[data-recent-kind]");
  if (!b) return;
  const { recentKind: kind, recentId: id } = b.dataset;
  if (kind === "train") select(id);
  else if (kind === "station") selectStation(id);
  else if (kind === "railroad") openRailroad(id);
  else openLine(id.slice(0, id.indexOf("|")), id.slice(id.indexOf("|") + 1));
});

on("agencies", "change", (e) => {
  if (!e.target.matches("[data-history-year]")) return;
  state.historyYear = e.target.value;
  renderAgencies();
});
on("agencies", "click", (e) => {
  // Near you: find them, track a train, or open one.
  if (e.target.closest("[data-near-locate]")) return locateNear();
  const nearTrack = e.target.closest("[data-near-track]");
  if (nearTrack) {
    const t = state.trains.get(nearTrack.dataset.nearTrack);
    if (!t) return;
    select(t.id);
    return openTrackSheet(t);
  }
  const near = e.target.closest("[data-select]");
  if (near) return select(near.dataset.select);
  // The pages: Settings (phones), signing in, a trip (its form), a new one,
  // one taken, another page, History's year.
  if (e.target.closest("[data-settings]")) {
    e.stopPropagation();
    return toggleMenu();
  }
  const provider = e.target.closest("[data-signin-provider]");
  if (provider) return loadAccount().then((a) => a?.signInWith(provider.dataset.signinProvider));
  if (e.target.closest("[data-signin-email]")) return loadAccount().then((a) => a?.open("signin"));
  const go = e.target.closest("[data-tab-go]");
  if (go) return setTab(go.dataset.tabGo);
  if (e.target.closest("[data-trip-add]")) return loadAccount().then((a) => a?.addTrip());
  const taken = e.target.closest("[data-trip-taken]");
  if (taken) return account?.markTaken(taken.dataset.tripTaken);
  const trip = e.target.closest("[data-trip]");
  if (trip) return loadAccount().then((a) => a?.editTrip(trip.dataset.trip));
  if (e.target.closest("[data-history-year]")) return;
  const histStation = e.target.closest("[data-station]");
  if (histStation) return selectStation(histStation.dataset.station);
  if (e.target.closest("[data-all-railroads]")) {
    openCountry = "*";
    renderAgencies();
    $("agencies").scrollTop = 0;
    return $("agencies").querySelector(".country-back")?.scrollIntoView({ block: "nearest" });
  }
  const country = e.target.closest("[data-country]");
  if (country) return frameCountry(country.dataset.country);
  if (e.target.closest("[data-country-back]")) {
    openCountry = null;
    return renderAgencies();
  }
  const toggle = e.target.closest("[data-toggle]");
  const info = e.target.closest("[data-railroad]");
  if (toggle) {
    const id = toggle.dataset.toggle;
    state.hidden.has(id) ? state.hidden.delete(id) : state.hidden.add(id);
    store.set("tt-hidden", [...state.hidden]);
    redraw();
    redrawStations();
    redrawRail();
    renderAll();
  } else if (info) {
    openRailroad(info.dataset.railroad);
  }
});


// ---------- Settings menu ----------

function applyTheme() {
  const next = resolveTheme();
  for (const b of $("theme-choice")?.children || []) b.setAttribute("aria-pressed", String(b.dataset.themeChoice === themePref));
  if (next === theme) return;
  theme = next;
  document.documentElement.dataset.theme = theme;
  // diff:false forces a full reload so "style.load" fires and our layers are
  // re-added; a diffed swap silently drops them.
  map.setStyle(STYLES[theme], { diff: false });
}
prefersDark.addEventListener("change", () => themePref === "auto" && applyTheme());

on("theme-choice", "click", (e) => {
  const b = e.target.closest("[data-theme-choice]");
  if (!b) return;
  themePref = b.dataset.themeChoice;
  store.set("tt-theme", themePref);
  applyTheme();
});

// Language: English, French, or the browser's ("auto"). The page reloads in it.
for (const b of $("lang-choice")?.children || []) b.setAttribute("aria-pressed", String(b.dataset.lang === langPref));
on("lang-choice", "click", (e) => {
  const b = e.target.closest("[data-lang]");
  if (!b || b.dataset.lang === langPref) return;
  store.set("tt-lang", b.dataset.lang);
  location.reload();
});

function applyUnits() {
  for (const b of $("units-choice")?.children || []) b.setAttribute("aria-pressed", String(b.dataset.units === state.units));
  scaleBar.setUnit(state.units === "km" ? "metric" : "imperial");
}
on("units-choice", "click", (e) => {
  const b = e.target.closest("[data-units]");
  if (!b) return;
  state.units = b.dataset.units;
  store.set("tt-units", state.units);
  applyUnits();
  renderAll();
});

function applyLabels() {
  for (const b of $("labels-choice")?.children || []) b.setAttribute("aria-pressed", String(b.dataset.labels === state.labels));
}
on("labels-choice", "click", (e) => {
  const b = e.target.closest("[data-labels]");
  if (!b) return;
  state.labels = b.dataset.labels;
  store.set("tt-labels", state.labels);
  applyLabels();
  applySelectionFilter();
  redraw();
});
on("estimated-toggle", "change", (e) => {
  state.hideEstimated = e.target.checked;
  store.set("tt-hide-estimated", state.hideEstimated);
  redraw();
  renderAll();
});
on("only-tracked-toggle", "change", (e) => {
  state.onlyTracked = e.target.checked;
  store.set("tt-only-tracked", state.onlyTracked);
  redraw();
  renderAll();
});
on("colorblind-toggle", "change", (e) => {
  state.colorblind = e.target.checked;
  store.set("tt-colorblind", state.colorblind);
  document.documentElement.toggleAttribute("data-colorblind", state.colorblind);
});
on("clock-toggle", "change", (e) => {
  state.clock24 = e.target.checked;
  store.set("tt-clock24", state.clock24);
  renderAll();
});

function setShowStations(on) {
  state.showStations = on;
  store.set("tt-stations", on);
  setChecked("stations-toggle", on);
  for (const id of ["tt-stations-minor", "tt-stations-major", "tt-station-labels", "tt-footprint-fill", "tt-footprint-line"]) {
    if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", on ? "visible" : "none");
  }
}
on("stations-toggle", "change", (e) => setShowStations(e.target.checked));


on("heading-toggle", "change", (e) => {
  state.inferHeading = e.target.checked;
  store.set("tt-infer-heading", state.inferHeading);
  computePositions();
  animateTo();
  renderAll();
});

// Time zones to show times in: the viewer's own (the default), each stop's
// local time, or one of the zones the railroads run in.
const TIME_ZONE_CHOICES = [
  ["station", "Each station's local time"],
  ["America/St_Johns", "Newfoundland"], ["America/Halifax", "Atlantic"], ["America/New_York", "Eastern"],
  ["America/Chicago", "Central"], ["America/Denver", "Mountain"], ["America/Phoenix", "Arizona"],
  ["America/Los_Angeles", "Pacific"], ["America/Anchorage", "Alaska"], ["Pacific/Honolulu", "Hawaii"], ["UTC", "UTC"],
];
// The listed zone that keeps the same clock as `zone` (America/Detroit ->
// Eastern), judged by its offsets in winter and summer; or null.
function listedZone(zone) {
  const clock = (z, m) => new Date(Date.UTC(new Date().getUTCFullYear(), m, 15, 12)).toLocaleString("en-US", { timeZone: z, hour: "numeric", minute: "numeric", hourCycle: "h23" });
  try {
    return TIME_ZONE_CHOICES.find(([v]) => v === zone)?.[0] ||
      TIME_ZONE_CHOICES.find(([v]) => v !== "station" && v !== "UTC" && clock(v, 0) === clock(zone, 0) && clock(v, 6) === clock(zone, 6))?.[0] || null;
  } catch {
    return null;
  }
}
// Until a zone is picked, times follow the device and the menu checks the
// listed zone that matches it; a device zone that matches none of them gets
// its own entry at the top.
function initTimeZones() {
  const select = $("tz-choice");
  if (!select) return;
  const own = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const match = own ? listedZone(own) : null;
  const opts = match ? TIME_ZONE_CHOICES
    : [["", own ? T("Your time zone ({zone})", { zone: own.split("/").pop().replace(/_/g, " ") }) : T("Your time zone")], ...TIME_ZONE_CHOICES];
  select.innerHTML = opts.map(([v, label]) => `<option value="${v}">${esc(T(label))}</option>`).join("");
  if (state.timeZone && !opts.some(([v]) => v === state.timeZone)) state.timeZone = "";
  select.value = state.timeZone || match || "";
}
on("tz-choice", "change", (e) => {
  state.timeZone = e.target.value;
  store.set("tt-tz", state.timeZone);
  renderAll();
});

on("infer-toggle", "change", (e) => {
  state.inferDelays = e.target.checked;
  store.set("tt-infer", state.inferDelays);
  applyInference();
  renderAll();
});

function toggleMenu(open = $("settings-menu").hidden) {
  const menu = $("settings-menu"), btn = $("settings-btn");
  menu.hidden = !open;
  btn.setAttribute("aria-expanded", String(open));
  $("rail-settings")?.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("menu-open", open);
  if (!open) return;
  // On a phone, a sheet up from the bottom (design.css), with Done.
  if (isPhone) {
    menu.removeAttribute("style");
    menu.scrollTop = 0;
    return;
  }
  // Beside the panel, level with its top, where the window has room for it
  // (the panel stays in view, as a sidebar's popover leaves it);
  const r = btn.getBoundingClientRect();
  menu.style.maxHeight = "";
  const w = menu.offsetWidth, h = menu.offsetHeight;
  const side = (panelAway ? $("tabbar") : $("panel")).getBoundingClientRect(); // beside the rail while the panel's away
  if (innerWidth - side.right >= w + 24) {
    menu.style.left = `${side.right + 12}px`;
    menu.style.top = `${side.top}px`;
    menu.style.maxHeight = `${innerHeight - side.top - 12}px`;
    return;
  }
  // else pinned under the gear (or over it, where there's more room), kept
  // inside the window; taller than the room it has, it scrolls.
  const below = innerHeight - r.bottom - 8 - 12, above = r.top - 8 - 12;
  const under = h <= below || below >= above;
  const room = under ? below : above;
  menu.style.maxHeight = `${Math.max(160, room)}px`;
  menu.style.left = `${Math.max(12, Math.min(r.right - w, innerWidth - w - 12))}px`;
  menu.style.top = `${under ? r.bottom + 8 : Math.max(12, r.top - 8 - Math.min(h, room))}px`;
}
on("settings-btn", "click", (e) => {
  e.stopPropagation();
  toggleMenu();
});
on("menu-done", "click", () => toggleMenu(false));
document.addEventListener("click", (e) => {
  if (!$("settings-menu").hidden && !e.target.closest("#settings-menu, #rail-settings, [data-settings]")) toggleMenu(false);
});
document.addEventListener("keydown", (e) => e.key === "Escape" && toggleMenu(false));

// ---------- Keyboard shortcuts (on a computer) ----------

const SHORTCUTS = [
  ["1 2 3", "My trips, Browse, History"],
  ["/", "Search"],
  ["Esc", "Back to the home page"],
  ["B", "Back one page"],
  ["F", "Follow the open train"],
  ["C", "Copy a link to the open train"],
  ["?", "Show these shortcuts"],
];
function toggleShortcuts(open = !document.querySelector(".keys-sheet")) {
  document.querySelector(".keys-sheet")?.remove();
  if (!open) return;
  const el = document.createElement("div");
  el.className = "keys-sheet";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", T("Keyboard shortcuts"));
  el.innerHTML = `<div class="keys-card"><h3>${T("Keyboard shortcuts")}</h3><ul>${SHORTCUTS.map(([k, what]) => `<li><kbd>${esc(T(k))}</kbd><span>${esc(T(what))}</span></li>`).join("")}</ul></div>`;
  el.addEventListener("click", (e) => { if (!e.target.closest(".keys-card")) toggleShortcuts(false); });
  document.body.append(el);
}
on("keys-btn", "click", () => { toggleMenu(false); toggleShortcuts(); });
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
  const typing = e.target.closest?.("input, textarea, select, [contenteditable]");
  const sheet = document.querySelector(".keys-sheet");
  if (e.key === "Escape") {
    if (sheet) return toggleShortcuts(false);
    if (!$("settings-menu").hidden || typing) return; // closes the menu / clears the search
    if (state.selected || state.station || state.railroad) goHome();
    return;
  }
  if (typing) return;
  const open = state.selected && state.trains.get(state.selected);
  switch (e.key) {
    case "1": case "2": case "3":
      if (!document.body.classList.contains("has-tabs")) return;
      setTab(["trips", "browse", "history"][Number(e.key) - 1]);
      break;
    case "/":
      e.preventDefault();
      if (state.selected || state.station || state.railroad) goHome();
      putPanelAway(false);
      if (state.tab !== "browse") setTab("browse");
      if (isPhone) setSheet("expanded");
      $("search").focus();
      $("search").select();
      break;
    case "?":
      return toggleShortcuts();
    case "b": case "B":
      if (state.selected || state.station || state.railroad) closeDetail();
      break;
    case "f": case "F":
      if (open) $("follow-btn").click();
      break;
    case "c": case "C":
      if (open) $("share-btn").click();
      break;
    default:
      return;
  }
  toggleShortcuts(false);
}, true);
map.on("movestart", () => toggleMenu(false));

applyTheme();
applyUnits();
setChecked("stations-toggle", state.showStations);
setChecked("estimated-toggle", state.hideEstimated);
setChecked("clock-toggle", state.clock24);
setChecked("colorblind-toggle", state.colorblind);
setChecked("only-tracked-toggle", state.onlyTracked);
applyLabels();
setChecked("infer-toggle", state.inferDelays);
setChecked("heading-toggle", state.inferHeading);
initTimeZones();

// ---------- Install as an app ----------
// Installable (manifest.webmanifest, sw.js). Chrome and Edge offer their own
// install prompt; on an iPhone it's Share, then Add to Home Screen. Settings
// (Help) has the option wherever it's possible.

if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
let installPrompt = null;
const showInstall = () => { $("install-btn").hidden = standalone || !(installPrompt || isIOS); };
async function install() {
  if (!installPrompt) return toast(T("In Safari, tap Share, then Add to Home Screen."));
  installPrompt.prompt();
  await installPrompt.userChoice.catch(() => null);
  installPrompt = null;
  showInstall();
}
addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installPrompt = e;
  showInstall();
});
addEventListener("appinstalled", () => {
  installPrompt = null;
  showInstall();
});
on("install-btn", "click", () => { toggleMenu(false); install(); });
showInstall();

// Phone bottom sheet: collapsed / normal / expanded, as iOS's sheets' small,
// medium and large detents. Dragged by its grabber or its top bar (the
// search row, a page's back button), it follows the finger, and on letting
// go settles at the detent the flick was heading for; a tap on the grabber
// steps through them.
const sheetMode = () => { const p = $("panel"); return p.classList.contains("collapsed") ? "collapsed" : p.classList.contains("expanded") ? "expanded" : ""; };
function setSheet(mode) {
  const p = $("panel");
  p.classList.toggle("collapsed", mode === "collapsed");
  p.classList.toggle("expanded", mode === "expanded");
  document.body.classList.toggle("sheet-collapsed", mode === "collapsed");
  document.body.classList.toggle("sheet-expanded", mode === "expanded");
}
// Each detent's height, as the stylesheet sets it (design.css).
function sheetHeights() {
  const p = $("panel"), cls = p.className, was = p.style.height;
  p.style.transition = "none";
  p.style.height = "";
  const heights = {};
  for (const mode of ["collapsed", "", "expanded"]) {
    setSheet(mode);
    heights[mode] = p.getBoundingClientRect().height;
  }
  p.className = cls;
  setSheet(sheetMode());
  p.style.height = was;
  void p.offsetHeight;
  p.style.transition = "";
  return heights;
}
on("sheet-handle", "click", () => {
  if (sheetDragged) return;
  const mode = sheetMode();
  setSheet(mode === "collapsed" ? "" : mode === "expanded" ? "collapsed" : "expanded");
});
let sheetDragged = false;
{
  const panel = $("panel");
  let drag = null;
  panel?.addEventListener("pointerdown", (e) => {
    if (!isPhone || e.button > 0 || !e.target.closest(".sheet-handle, .search-row, .detail-top, .page-head")) return;
    if (e.target.closest("input, select, textarea")) return;
    drag = { y: e.clientY, id: e.pointerId, h: panel.getBoundingClientRect().height, moving: false, samples: [] };
    sheetDragged = false;
  });
  // Followed on the window: a mouse leaves the sheet at once (a finger's
  // events stay with where it went down).
  addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dy = e.clientY - drag.y;
    if (!drag.moving) {
      if (Math.abs(dy) < 6) return;
      drag.moving = true;
      drag.heights = sheetHeights();
      panel.classList.add("dragging");
    }
    const { collapsed: lo, expanded: hi } = drag.heights;
    let h = drag.h - dy;
    // Past the first and last detents it gives, like a rubber band.
    if (h > hi) h = hi + (h - hi) / 4;
    if (h < lo) h = lo - (lo - h) / 4;
    panel.style.height = `${h}px`;
    drag.samples.push([e.timeStamp, e.clientY]);
    if (drag.samples.length > 5) drag.samples.shift();
  });
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (!d.moving) return;
    sheetDragged = true; // the click that follows isn't a tap
    setTimeout(() => (sheetDragged = false), 0);
    const [t0, y0] = d.samples[0] || [e.timeStamp, e.clientY];
    const v = e.timeStamp > t0 ? (y0 - e.clientY) / (e.timeStamp - t0) : 0; // px/ms, upward positive
    const h = panel.getBoundingClientRect().height + v * 180; // where the flick was heading
    const [mode] = Object.entries(d.heights).sort((a, b) => Math.abs(a[1] - h) - Math.abs(b[1] - h))[0];
    panel.classList.remove("dragging");
    panel.style.height = "";
    setSheet(mode);
    if (mode !== "expanded" && document.activeElement?.id === "search") $("search").blur();
  };
  addEventListener("pointerup", end);
  addEventListener("pointercancel", end);
  // A drag that began on a button isn't a press of it.
  panel?.addEventListener("click", (e) => { if (sheetDragged) { e.stopPropagation(); e.preventDefault(); } }, true);
}

let toastTimer;
function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 4000);
}

// Open a shared link to a specific train once its feed has loaded.
const wantedStation = new URL(location.href).searchParams.get("station");
const wantedRailroad = new URL(location.href).searchParams.get("railroad");
const wanted = new URL(location.href).searchParams.get("train");
// A shared ride (?ride=1, with its stops): the train, tracked here too.
const sharedRide = (() => {
  const q = new URL(location.href).searchParams;
  return q.get("ride") ? { to: q.get("to") } : null;
})();
if (wanted) {
  needData(wanted.split(":")[0]); // its stops' stations, abroad
  const wait = setInterval(() => {
    if (state.trains.has(wanted)) {
      clearInterval(wait);
      const t = state.trains.get(wanted);
      if (sharedRide && !state.tracked.some((r) => r.id === wanted)) {
        startTracking(t, sharedRide.to || null);
        const to = sharedRide.to && t.stops?.find((s) => s.key === sharedRide.to);
        toast(to ? T("Following a shared ride to {place}.", { place: to.name }) : T("Following a shared ride."));
      }
      if (sharedRide) {
        const u = new URL(location.href);
        for (const k of ["ride", "to", "from"]) u.searchParams.delete(k);
        history.replaceState(null, "", u);
      }
      select(wanted);
    }
  }, 500);
  setTimeout(() => clearInterval(wait), 30000);
}

// ---------- Loading ----------
// The panel is there from the first paint, ready for a search, and trains
// join the map as each railroad's feed comes in (the list shimmers for the
// ones still on their way). Only the map is waited for: if it isn't drawn,
// with its track, half a second into the visit, railroads' typical trains
// roll by in its place (behind the panel, never over it) until it is, one
// after another, each chosen at random (never the same twice in a row),
// leading end first at a steady speed whatever its length. A quick load
// shows none of it. Gives up waiting after 12 seconds.
const LOADING_TRAINS = [
  ["amtrak", "Acela"], ["amtrak", "Northeast Regional"], ["amtrak", "California Zephyr"], ["amtrak", "Pacific Surfliner"],
  ["amtrak", "Amtrak Cascades"], ["amtrak", "Wolverine"], ["amtrak", "Crescent"], ["via", "Corridor"], ["via", "Canadian"],
  ["brightline"], ["lirr", "Babylon"], ["mnr", "New Haven"], ["mbta"], ["njt"], ["septa"], ["metra", "Burlington Northern"], ["metra", "Metra Electric"],
  ["caltrain"], ["metrolink"], ["go"], ["marc", "Penn Line"], ["trirail"], ["frontrunner"], ["smart"], ["capmetro"], ["rtd"],
  ["coaster"], ["sprinter"], ["texrail"], ["silverline"], ["tre"], ["upx"], ["alaska", "Aurora Winter Train"],
];
// Every plug-in railroad with cars joins them, once each, wherever the viewer
// is: its typical train, or one of the routes its "loading" lists, its cars
// file loaded only when its turn comes.
for (const [id, a] of Object.entries(AGENCIES)) {
  if (a.cars) LOADING_TRAINS.push([id, Array.isArray(a.loading) ? a.loading : undefined]);
}
let mapLoaded = false; // map.loaded() turns false whenever the trains layer updates
map.once("load", () => (mapLoaded = true));
let loadingShown = false;
function showLoadingTrains() {
  loadingShown = true;
  const el = $("loading-train");
  if (!el) return;
  $("loading").classList.add("shown");
  let last = -1, turn = 0;
  const nextTrain = async () => {
    const mine = ++turn;
    // A few tries: a railroad abroad may have no typical train without a line.
    for (let tries = 0; tries < 6; tries++) {
      let i;
      do i = Math.floor(Math.random() * LOADING_TRAINS.length); while (i === last && LOADING_TRAINS.length > 1);
      last = i;
      const [agency, routes] = LOADING_TRAINS[i];
      const route = Array.isArray(routes) ? routes[Math.floor(Math.random() * routes.length)] ?? undefined : routes;
      if ((await loadCars(agency)) === false) continue;
      if (mine !== turn) return;
      const c = consistOf({ id: "loading", agency, route });
      if (c) return show(c, agency);
    }
  };
  const show = (c, agency) => {
    el.innerHTML = consistHtml(c, AGENCIES[agency].color);
    el.style.setProperty("--pass", `${((innerWidth + el.scrollWidth) / 450).toFixed(1)}s`);
    // Run the pass again from the start for this train.
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
  };
  nextTrain();
  el.addEventListener("animationend", nextTrain);
}
const loadingWait = setInterval(() => {
  const since = performance.now(); // since the visit began
  if (!(mapLoaded && railSettled) && since < 12000) {
    if (!loadingShown && since > 500) showLoadingTrains();
    return;
  }
  clearInterval(loadingWait);
  const el = $("loading");
  el.classList.add("done");
  setTimeout(() => el.remove(), loadingShown ? 500 : 0);
}, 100);

// ---------- Account ----------
// Signing in, a rider's trips, and their tracked trains on every device
// (js/account.js, with Supabase). Only where config.js names a project, and
// loaded only when a rider opens it or is already signed in here.

function loadAccount() {
  accountLoading ??= import("./account.js?v=dev").then((m) => m.init({
    agencies: AGENCIES, maxTracked: MAX_TRACKED, toast, fmtTime, plate,
    getTracked: () => state.tracked,
    setTracked(list) {
      state.tracked = list;
      saveTracked();
      checkTracked();
      applySelectionFilter();
      renderAll();
    },
    needData: (agency) => needData(agency) || Promise.resolve(),
    // A railroad's stations, by name, for the trip form.
    stationsOf(agency) {
      const seen = new Map();
      for (const s of state.stations.values()) for (const m of s.members) if (m.agency === agency && !seen.has(m.key)) seen.set(m.key, { key: m.key, name: m.name, place: m.place || "" });
      return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
    },
    stopTz(key) {
      const s = key && state.stations.get(state.stationOfKey?.get(key));
      return s ? s.members.find((m) => m.key === key)?.tz || s.tz : null;
    },
    findTrains, trainRuns, searchStations,
    // The station nearest the rider, when they've let Trainsheet find them
    // (Near you), within 30 km: where a first trip is planned from.
    nearestStation() {
      if (!nearFix) return null;
      let best = null, bestM = 30000;
      for (const st of state.stations.values()) {
        const m = meters(nearFix, st);
        if (m < bestM) { best = st; bestM = m; }
      }
      return best ? stationChoice(best) : null;
    },
    loadPlaces: () => { dataRegions()?.then((m) => m?.loadAll()); return stationsReady; },
    stationOfKey: (key) => {
      const st = key && state.stations.get(state.stationOfKey?.get(key));
      return st ? stationChoice(st) : null;
    },
    defaultAgency: () => state.railroad || state.trains.get(state.selected)?.agency || null,
    liveTrain: (agency, number) => (number ? [...state.trains.values()].find((t) => t.agency === agency && String(t.number) === String(number)) : null) || null,
    openTrain: (id) => select(id),
    accountChanged(user) {
      renderAccountButton(user, true);
      renderAgencies();
      renderResults();
    },
    tripsChanged() {
      trackPlanned();
      renderAgencies();
      renderResults(); // Browse's ticks on the trains added
    },
  })).then((a) => (account = a)).catch((e) => {
    console.warn("Trainsheet: accounts unavailable", e);
    accountLoading = null;
    toast(T("Couldn't reach the sign-in service. Try again in a moment."));
    return null;
  });
  return accountLoading;
}
// The rider's monogram, as Apple's apps show an account: their initials on
// a gray circle (a person's outline when signed out), in place of a gear on
// the rail, beside the search field and by each page's title; it opens
// Settings, which starts with the account. Kept on the device ("tt-initials")
// so it shows from the first paint, before the account is loaded.
// Apple's default picture: a head, and shoulders running off the circle's foot.
const PERSON_ICON = '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="12.4" r="5.6" fill="currentColor"/><path d="M4.5 34c0-7.6 5.2-13.4 11.5-13.4S27.5 26.4 27.5 34Z" fill="currentColor"/></svg>';
function initialsOf(user) {
  const meta = user?.user_metadata || {};
  const first = (w) => [...w][0] || "";
  const words = String(meta.full_name || meta.name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length) return (first(words[0]) + (words.length > 1 ? first(words[words.length - 1]) : "")).toUpperCase();
  const local = String(user?.email || "").split("@")[0], parts = local.split(/[._+-]+/).filter(Boolean);
  return (parts.length > 1 ? first(parts[0]) + first(parts[parts.length - 1]) : first(local)).toUpperCase();
}
const avatarFace = () => (signedInHere() && esc(store.get("tt-initials", ""))) || PERSON_ICON;
const avatarHtml = (cls = "") => `<span class="avatar${cls ? ` ${cls}` : ""}" data-avatar aria-hidden="true">${avatarFace()}</span>`;
function renderAccountButton(user = account?.user, known = Boolean(account)) {
  const el = $("account-btn");
  if (!el) return;
  el.hidden = !accountsOn();
  if (known) store.set("tt-initials", user ? initialsOf(user) : "");
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || "";
  el.querySelector("[data-account-label]").textContent = user ? name || user.email || T("Account") : signedInHere() ? T("Account") : T("Sign in");
  el.querySelector("[data-account-sub]").textContent = user ? (name && user.email ? user.email : T("Account and password")) : signedInHere() ? "" : T("Your trips, on every device");
  if (!accountsOn()) return; // without accounts, Settings keeps its gear
  for (const a of document.querySelectorAll("[data-avatar]")) a.innerHTML = avatarFace();
  for (const b of [$("settings-btn"), $("rail-settings")]) {
    if (!b) continue;
    if (!b.querySelector("[data-avatar]")) b.innerHTML = avatarHtml();
    b.classList.add("avatar-btn");
    b.title = T("Account and settings");
    b.setAttribute("aria-label", T("Account and settings"));
  }
}
on("account-btn", "click", async () => {
  toggleMenu(false);
  (await loadAccount())?.open();
});
renderAccountButton();
// The pages (Pages, above): where accounts are on, the tab bar at the foot of
// the sheet (phones) or the rail beside the panel (computers), opening on My
// trips for a rider signed in on this device and on Browse otherwise.
if (accountsOn() && $("tabbar")) {
  document.body.classList.add("has-tabs");
  $("tabbar").hidden = false;
  if (isPhone) $("panel").append($("tabbar"));
  state.tab = signedInHere() ? "trips" : "browse";
  $("tabbar").querySelector(`[data-tab="${state.tab}"]`)?.setAttribute("aria-current", "page");
  // Opened on the map, the panel put away (from the first paint: index.html),
  // unless a shared link opens a page in it.
  if (document.documentElement.classList.contains("panel-boot-away")) putPanelAway(true, { boot: true });
}
document.documentElement.classList.remove("panel-boot-away");
$("view-list").dataset.tab = state.tab;
if (ACCOUNTS.url && ACCOUNTS.key) {
  // Signed in on this device already, or back from Google, Facebook or a
  // link in an email (?code=): load it now. Otherwise only when asked.
  const q = new URL(location.href).searchParams;
  if (store.get("tt-auth", null) || q.has("code") || q.has("error_description")) loadAccount();
}

// Handy for poking at the live state from the browser console.
// For debugging and audits from the console.
window.trainsheet = { state, map, checkTracked, setTab, putPanelAway, select, selectStation, openRailroad, openLine, closeDetail, modelOf, focusFeatures, orderedLineStations, allLines };

start();
