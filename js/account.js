// Accounts: signing in (email and password, or Google, Facebook and the
// other providers turned on in config.js), a rider's trips (planned and
// taken), and their tracked trains kept the same on every device they sign
// in on. The data lives in a Supabase project (supabase/schema.sql), which
// only lets each account read and write its own rows.
//
// Loaded only when it's needed: when a rider opens Account in Settings, or
// when they're already signed in on this device (js/app.js looks for the
// saved session before importing this). Supabase's library comes with it.
// Nobody else downloads any of it.

import { t as T, tn as Tn, dateFormat } from "./i18n.js?v=dev";
import { fold } from "./stations.js?v=dev";

const CONFIG = window.TRAINSHEET_ACCOUNTS || {};
// localStorage "tt-accounts-lib" overrides the library's address, for testing.
const LIB = (() => { try { return localStorage.getItem("tt-accounts-lib"); } catch { return null; } })() ||
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.0/+esm";
// Where the session is kept (js/app.js checks for it to know whether to load
// this module at start).
export const STORAGE_KEY = "tt-auth";
const PROVIDERS = {
  google: "Google", facebook: "Facebook", apple: "Apple", github: "GitHub", azure: "Microsoft", discord: "Discord",
};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const $ = (sel, root = document) => root.querySelector(sel);

let ctx;          // what js/app.js lends this module (init())
let sb;           // the Supabase client
let user = null;  // the signed-in user, or null
let trips = null; // the account's trips once fetched: [row]
let view = "signin"; // what the sheet shows: signin, signup, reset, code, newpass, trips, plan, form
let plan = null;     // the planner: { from, to, typed, day, trains, exact, loading } (stations as { id, name, sub })
let prefill = null;  // a new trip filled in from a train the planner found
let resetEmail = ""; // where the reset email went (the code view)
let tab = "upcoming";
let editing = null;  // the trip being edited in the form (null: a new one)
let notice = "";     // a line over the form: "Check your email…", or an error
let busy = false;

// ---------- Start ----------

export async function init(context) {
  ctx = context;
  const { createClient } = await import(LIB);
  sb = createClient(CONFIG.url, CONFIG.key, {
    auth: { storageKey: STORAGE_KEY, flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  sb.auth.onAuthStateChange((event, session) => {
    // Supabase's own calls can't be awaited inside this callback.
    setTimeout(() => authChanged(event, session), 0);
  });
  // Back from Google or Facebook, or from a link in an email: the library
  // has read the code in the address; take it out of the address bar.
  const { data, error } = await sb.auth.getSession();
  const url = new URL(location.href);
  const fromLink = url.searchParams.has("code") || url.searchParams.has("error_description");
  if (fromLink) {
    const why = url.searchParams.get("error_description");
    for (const k of ["code", "error", "error_code", "error_description"]) url.searchParams.delete(k);
    history.replaceState(null, "", url);
    if (why || error) ctx.toast(T("Couldn't sign you in: {why}", { why: why || error.message }));
    else if (!data.session) ctx.toast(T("That link has expired or was opened in another browser. Sign in again."));
  }
  if (data.session && !user) await authChanged("INITIAL_SESSION", data.session);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshTracked(); });
  setInterval(() => { if (!document.hidden) refreshTracked(); }, 60000);
  return api;
}

async function authChanged(event, session) {
  if (event === "PASSWORD_RECOVERY") {
    user = session?.user || null;
    view = "newpass";
    notice = "";
    return openSheet();
  }
  const was = user?.id;
  user = session?.user || null;
  ctx.accountChanged(user);
  if (user && user.id !== was) {
    trips = null;
    if (view !== "newpass") view = "trips";
    await joinTracked();
    loadTrips();
  }
  if (!user) {
    trips = null;
    remoteAt = null;
    lastSig = null;
    if (!["signup", "reset", "code"].includes(view)) view = "signin";
  }
  render();
  ctx.tripsChanged?.();
}

// ---------- Tracked trains, on every device ----------
// The list is kept whole in one row (user_state). The newer copy wins: a
// device pushes its list when the trains in it or their stops change, and
// takes the account's when that's newer (checked on coming back to the page
// and every minute). On signing in, the two are joined.

let remoteAt = null;  // updated_at of the account's copy this device last had
let lastSig = null;   // the trains and stops last pushed or taken
let pushTimer;
const sig = (list) => JSON.stringify(list.map((r) => [r.id, r.number, r.stopKey]));
const slim = (list) => list.map(({ id, agency, number, route, stopKey, stopName, eta, lastSeen, fromKey, fromName, departAt, riding, confirmed }) =>
  ({ id, agency, number, route, stopKey, stopName, eta, lastSeen, fromKey, fromName, departAt, riding, confirmed }));

async function pullTracked() {
  const { data, error } = await sb.from("user_state").select("tracked, updated_at").maybeSingle();
  if (error) throw error;
  return data;
}

async function pushTracked(list) {
  const { data, error } = await sb.from("user_state").upsert({ user_id: user.id, tracked: slim(list) }).select("updated_at").single();
  if (error) throw error;
  remoteAt = data.updated_at;
}

// This device's tracked trains and the account's, together (the account's
// first, three at most, as on one device).
async function joinTracked() {
  try {
    const row = await pullTracked();
    const local = ctx.getTracked();
    const remote = Array.isArray(row?.tracked) ? row.tracked : [];
    const joined = [...remote];
    for (const r of local) if (!joined.some((x) => x.id === r.id)) joined.push(r);
    const list = joined.slice(0, ctx.maxTracked);
    lastSig = sig(list);
    if (sig(list) !== sig(local)) ctx.setTracked(list);
    if (!row || sig(list) !== sig(remote)) await pushTracked(list);
    else remoteAt = row.updated_at;
  } catch (e) {
    console.warn("Trainsheet: couldn't sync tracked trains", e);
  }
}

async function refreshTracked() {
  if (!user) return;
  try {
    const row = await pullTracked();
    if (!row || row.updated_at === remoteAt) return;
    remoteAt = row.updated_at;
    const local = ctx.getTracked();
    // Keep what this device last saw of a train it's tracking too.
    const list = (row.tracked || []).map((r) => ({ ...r, ...pick(local.find((x) => x.id === r.id), ["lastSeen", "eta"]) }));
    if (sig(list) === sig(local)) return;
    lastSig = sig(list);
    ctx.setTracked(list);
  } catch (e) {
    console.warn("Trainsheet: couldn't sync tracked trains", e);
  }
}
const pick = (o, keys) => (o ? Object.fromEntries(keys.filter((k) => o[k] != null).map((k) => [k, o[k]])) : {});

function trackedChanged(list) {
  if (!user || sig(list) === lastSig) return;
  lastSig = sig(list);
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => pushTracked(list).catch((e) => console.warn("Trainsheet: couldn't sync tracked trains", e)), 800);
}

// ---------- Trips ----------

// A day as YYYY-MM-DD in a time zone (the railroad's, else the viewer's).
const dayOf = (ms, tz) => {
  try { return new Intl.DateTimeFormat("en-CA", { timeZone: tz || undefined, year: "numeric", month: "2-digit", day: "2-digit" }).format(ms); } catch { return new Intl.DateTimeFormat("en-CA").format(ms); }
};
const today = () => dayOf(Date.now());

async function loadTrips() {
  if (!user) return;
  const { data, error } = await sb.from("trips").select("*").order("service_date", { ascending: false }).order("depart_at", { ascending: false, nullsFirst: false }).limit(1000);
  if (error) {
    notice = T("Couldn't load your trips: {why}", { why: error.message });
    trips = [];
  } else trips = data;
  render();
  ctx.tripsChanged?.();
}

// A tracked train reached the stop it was tracked to (js/app.js): logged as
// a trip taken. Two devices tracking the same ride log it once (ride_key).
async function logRide(rec, arrivedAt) {
  if (!user || !rec?.agency) return;
  const tz = ctx.agencies[rec.agency]?.tz;
  const leftAt = rec.departAt || arrivedAt || Date.now();
  const day = dayOf(leftAt, tz);
  const row = {
    agency: rec.agency, number: rec.number ? String(rec.number) : null, route: rec.route || null, service_date: day,
    from_name: rec.fromName || null, from_key: rec.fromKey || null, to_name: rec.stopName || null, to_key: rec.stopKey || null,
    depart_at: rec.departAt ? new Date(rec.departAt).toISOString() : null,
    arrive_at: arrivedAt ? new Date(arrivedAt).toISOString() : null,
    status: "taken", source: "tracked", ride_key: `${rec.id}|${day}`,
  };
  // A trip planned for this train that day becomes the one taken.
  if (row.number) {
    const { data, error } = await sb.from("trips").update({ status: "taken", ride_key: row.ride_key, arrive_at: row.arrive_at })
      .eq("agency", row.agency).eq("number", row.number).eq("service_date", day).eq("status", "planned").select("id");
    if (error) return console.warn("Trainsheet: couldn't log the ride", error);
    if (data.length) return trips && loadTrips();
  }
  const { error } = await sb.from("trips").upsert(row, { onConflict: "user_id,ride_key", ignoreDuplicates: true });
  if (error) return console.warn("Trainsheet: couldn't log the ride", error);
  if (trips) loadTrips();
}

// Upcoming: planned for today or later. History: taken, cancelled, or a
// planned day that has gone by.
const isUpcoming = (r) => r.status === "planned" && r.service_date >= today();
const byWhen = (a, b) => (a.service_date + (a.depart_at || "")).localeCompare(b.service_date + (b.depart_at || ""));

// ---------- The sheet ----------

const sheet = () => $(".acct-sheet");

function openSheet() {
  if (!sheet()) {
    const el = document.createElement("div");
    el.className = "acct-sheet";
    el.innerHTML = `<div class="acct-card" role="dialog" aria-modal="true" aria-labelledby="acct-title"></div>`;
    el.addEventListener("click", onClick);
    el.addEventListener("submit", onSubmit);
    el.addEventListener("change", onChange);
    el.addEventListener("input", onInput);
    el.addEventListener("focusin", onFocus);
    el.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); closeSheet(); } });
    document.body.append(el);
  }
  if (user && trips === null) loadTrips();
  render();
  const first = $(".acct-card input, .acct-card button:not(.tc-x)", sheet());
  first?.focus({ preventScroll: true });
}
function closeSheet() {
  sheet()?.remove();
  shown = null;
  if (view === "form") view = "trips";
  notice = "";
}

function render() {
  const card = $(".acct-card", sheet() || undefined);
  if (!sheet() || !card) return;
  const head = (title, back) => `<div class="acct-head">
      ${back ? `<button type="button" class="acct-back" data-go="${back}" aria-label="${T("Back")}">‹</button>` : ""}
      <h3 id="acct-title">${esc(title)}</h3>
      <button type="button" class="tc-x" data-close aria-label="${T("Close")}">×</button></div>`;
  const note = notice ? `<p class="acct-notice" role="status">${esc(notice)}</p>` : "";
  const dis = busy ? " disabled" : "";
  const email = (auto = "email") => `<label class="acct-field"><span>${T("Email")}</span><input name="email" type="email" required autocomplete="${auto}" value="${esc(user?.email || "")}"></label>`;
  let body = "";
  if (view === "signin" || view === "signup") {
    const providers = (CONFIG.providers || []).filter((p) => PROVIDERS[p]);
    body = head(view === "signin" ? T("Sign in") : T("Create an account")) + note +
      `<p class="acct-lede">${T("Keep a log of your trips, plan the trains you'll take, and follow your tracked trains on every device.")}</p>` +
      (providers.length ? `<div class="acct-providers">${providers.map((p) =>
        `<button type="button" class="btn acct-provider" data-provider="${p}"${dis}>${esc(T("Continue with {provider}", { provider: PROVIDERS[p] }))}</button>`).join("")}</div>
        <div class="acct-or"><span>${T("or")}</span></div>` : "") +
      `<form class="acct-form" data-form="${view}">${email()}
        <label class="acct-field"><span>${T("Password")}</span><input name="password" type="password" required minlength="8" autocomplete="${view === "signin" ? "current-password" : "new-password"}"></label>
        <button class="btn primary" type="submit"${dis}>${view === "signin" ? T("Sign in") : T("Create account")}</button></form>
      <div class="acct-links">${view === "signin"
        ? `<button type="button" class="acct-link" data-go="signup">${T("Create an account")}</button><button type="button" class="acct-link" data-go="reset">${T("Forgot your password?")}</button>`
        : `<button type="button" class="acct-link" data-go="signin">${T("I already have an account")}</button>`}</div>
      <p class="acct-legal"><a href="privacy.html">${T("Privacy policy")}</a></p>`;
  } else if (view === "reset") {
    body = head(T("Reset your password"), "signin") + note +
      `<form class="acct-form" data-form="reset"><p class="acct-lede">${T("We'll email you a code and a link to choose a new password.")}</p>${email()}
        <button class="btn primary" type="submit"${dis}>${T("Send the email")}</button></form>`;
  } else if (view === "code") {
    // The email's code works on any device; its link only in the browser
    // that asked for it (PKCE), which a phone's mail app often isn't.
    body = head(T("Enter the code"), "reset") + note +
      `<form class="acct-form" data-form="code"><p class="acct-lede">${esc(T("Type the code in the email sent to {email}, or open the link in it on this device.", { email: resetEmail }))}</p>
        <label class="acct-field"><span>${T("Code")}</span><input name="token" required inputmode="numeric" autocomplete="one-time-code" pattern="[0-9 ]{6,10}" maxlength="10"></label>
        <button class="btn primary" type="submit"${dis}>${T("Continue")}</button></form>
      <div class="acct-links"><button type="button" class="acct-link" data-resend>${T("Send it again")}</button></div>`;
  } else if (view === "newpass") {
    body = head(T("Choose a new password"), changing ? "trips" : null) + note +
      `<form class="acct-form" data-form="newpass"><label class="acct-field"><span>${T("New password")}</span><input name="password" type="password" required minlength="8" autocomplete="new-password"></label>
        <button class="btn primary" type="submit"${dis}>${T("Save password")}</button></form>`;
  } else if (view === "plan") {
    body = head(T("Plan a trip"), "trips") + note + planView();
  } else if (view === "form") {
    body = head(editing ? T("Edit trip") : T("Add a trip"), editing ? "trips" : "plan") + note + tripForm(editing || prefill);
  } else {
    body = head(T("Your trips")) + note + tripsView();
  }
  // Redrawn on the same view (a notice, a button busy), what was typed stays.
  const typed = view === shown ? [...card.querySelectorAll("input, select, textarea")].filter((el) => el.name)
    .map((el) => [el.name, el.type === "radio" ? el.checked && el.value : el.value]) : [];
  shown = view;
  card.innerHTML = body;
  for (const [name, value] of typed) {
    for (const el of card.querySelectorAll(`[name="${name}"]`)) {
      if (el.type === "radio") { if (value) el.checked = el.value === value; } else el.value = value;
    }
  }
  if (view === "form") fillStations().then(() => autofill());
}
let shown = null; // the view last drawn

function tripsView() {
  const all = trips || [];
  const upcoming = all.filter(isUpcoming).sort(byWhen);
  const past = all.filter((r) => !isUpcoming(r));
  const list = tab === "upcoming" ? upcoming : past;
  const taken = past.filter((r) => r.status === "taken");
  const stats = taken.length ? `<p class="acct-stats">${esc([
    Tn(taken.length, "1 trip taken", "{n} trips taken"),
    Tn(new Set(taken.map((r) => r.agency)).size, "1 railroad", "{n} railroads"),
    Tn(new Set(taken.map((r) => ctx.agencies[r.agency]?.country).filter(Boolean)).size, "1 country", "{n} countries"),
  ].join(" · "))}</p>` : "";
  return `<div class="acct-who"><span>${esc(T("Signed in as {who}", { who: user.email || user.user_metadata?.full_name || "" }))}</span>
      <button type="button" class="acct-link" data-signout>${T("Sign out")}</button></div>
    <div class="acct-bar">
      <div class="segmented two sm"><button data-tab="upcoming" aria-pressed="${tab === "upcoming"}">${T("Upcoming")} <span class="rr-count">${upcoming.length}</span></button>
        <button data-tab="history" aria-pressed="${tab === "history"}">${T("History")} <span class="rr-count">${past.length}</span></button></div>
      <button type="button" class="btn primary small" data-add>+ ${T("Add a trip")}</button>
    </div>
    ${tab === "history" ? stats : ""}
    <div class="acct-trips">${trips === null ? `<p class="empty">${T("Loading…")}</p>`
      : list.length ? list.map(tripRow).join("")
      : `<p class="empty">${tab === "upcoming" ? T("No trips planned. Add the trains you're going to take, and they'll show here.")
        : T("No trips yet. Trains you track to your stop are added here when you arrive, or add a trip yourself.")}</p>`}</div>
    <details class="acct-danger"><summary>${T("Account")}</summary>
      <p><button type="button" class="acct-link" data-change-password>${T("Change password")}</button></p>
      <p>${T("Deleting your account deletes your trips and tracked trains from Trainsheet's servers. It can't be undone.")}</p>
      <button type="button" class="btn small acct-delete" data-delete-account>${T("Delete my account")}</button>
      <p><a href="privacy.html">${T("Privacy policy")}</a></p></details>`;
}

function tripRow(r) {
  const a = ctx.agencies[r.agency] || { color: "#888", short: r.agency, name: r.agency };
  const date = dateFormat({ weekday: "short", month: "short", day: "numeric", year: r.service_date.slice(0, 4) === today().slice(0, 4) ? undefined : "numeric", timeZone: "UTC" })
    .format(new Date(`${r.service_date}T12:00:00Z`));
  const time = (iso, key) => (iso ? ` ${ctx.fmtTime(iso, ctx.stopTz(key))}` : "");
  // An arrival a day or more after the trip's day: "+1".
  const later = r.arrive_at ? Math.round((Date.parse(dayOf(Date.parse(r.arrive_at), ctx.stopTz(r.to_key) || a.tz)) - Date.parse(r.service_date)) / 86400000) : 0;
  const leg = [r.from_name && `${esc(r.from_name)}${time(r.depart_at, r.from_key)}`,
    r.to_name && `${esc(r.to_name)}${time(r.arrive_at, r.to_key)}${later > 0 ? ` <sup>+${later}</sup>` : ""}`].filter(Boolean).join(" → ");
  const live = r.service_date === today() && r.status === "planned" && ctx.liveTrain(r.agency, r.number);
  const badge = r.status === "cancelled" ? `<span class="status bad">${T("Cancelled")}</span>`
    : r.status === "planned" && !isUpcoming(r) ? `<span class="status">${T("Planned")}</span>` : "";
  return `<div class="acct-trip" style="--c:${a.color}">
      <div class="acct-trip-main">
        <div class="acct-trip-top">${ctx.plate(r.number || a.short, a.color, "xs")}<span class="acct-trip-route">${esc(r.route || a.name)}</span>${badge}</div>
        <div class="acct-trip-when">${esc(date)} · ${esc(a.short || a.name)}${leg ? `<br>${leg}` : ""}</div>
        ${r.notes ? `<div class="acct-trip-notes">${esc(r.notes)}</div>` : ""}
      </div>
      <div class="acct-trip-actions">
        ${live ? `<button type="button" class="btn primary small" data-open-train="${esc(live.id)}">${T("On the map")}</button>` : ""}
        ${r.status === "planned" && !isUpcoming(r) ? `<button type="button" class="btn small" data-taken="${r.id}">${T("I took it")}</button>` : ""}
        <button type="button" class="acct-link" data-edit="${r.id}">${T("Edit")}</button>
      </div>
    </div>`;
}

// ---------- Planning a trip ----------
// Where from, where to, and which day: the trains between them that day
// (from the railroads' timetables), one tap filling in the whole trip.
// Stations are offered as you type, the rider's usual ones first.

function startPlan() {
  plan = { from: null, to: null, typed: { from: "", to: "" }, day: today(), trains: null, exact: true, loading: false };
  ctx.loadPlaces?.();
}
const addDays = (day, n) => new Date(Date.parse(`${day}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

function planView() {
  const field = (which, label) => `<div class="plan-field">
      <label class="acct-field"><span>${label}</span><input data-plan="${which}" value="${esc(plan[which]?.name || plan.typed[which])}" placeholder="${T("Station or city")}" autocomplete="off" spellcheck="false"></label>
      <div class="plan-suggest" data-suggest="${which}" hidden></div></div>`;
  const t0 = today(), t1 = addDays(t0, 1);
  const dayBtn = (d, label) => `<button type="button" data-plan-day="${d}" aria-pressed="${plan.day === d}">${label}</button>`;
  const other = plan.day !== t0 && plan.day !== t1;
  let results;
  if (!plan.from || !plan.to) results = `<p class="plan-hint">${T("Choose where you're leaving from and where you're going, and the trains between them show here.")}</p>`;
  else if (plan.loading) results = `<p class="plan-hint">${T("Finding trains…")}</p>`;
  else if (!plan.trains?.length) results = `<p class="plan-hint">${T("No trains between these stations that day.")}</p>`;
  else {
    results = `<div class="plan-trains">${plan.trains.map((r, i) => {
      const a = ctx.agencies[r.agency] || { color: "#888", short: r.agency };
      const mins = Math.round((Date.parse(r.arriveAt) - Date.parse(r.departAt)) / 60000);
      const span = mins >= 60 ? `${Math.floor(mins / 60)} h${mins % 60 ? ` ${mins % 60} min` : ""}` : `${mins} min`;
      return `<button type="button" class="plan-train" data-pick="${i}">
        <span class="pt-times">${esc(ctx.fmtTime(r.departAt, r.fromTz))} – ${esc(ctx.fmtTime(r.arriveAt, r.toTz))}</span>
        <span class="pt-span">${esc(span)}</span>
        <span class="pt-train">${ctx.plate(r.number || a.short, a.color, "xs")}<span>${esc([r.route, a.short].filter(Boolean).join(" · "))}</span></span>
      </button>`;
    }).join("")}</div>` + (plan.exact ? "" : `<p class="plan-hint">${T("That day is past the timetable Trainsheet has, so these are the trains on that weekday now. Check again closer to the day.")}</p>`);
  }
  return `<div class="plan">
    <div class="plan-stations"><div class="plan-fields">${field("from", T("From"))}${field("to", T("To"))}</div>
      <button type="button" class="plan-swap" data-plan-swap aria-label="${T("Swap from and to")}" title="${T("Swap from and to")}">⇅</button></div>
    <div class="segmented plan-days">${dayBtn(t0, T("Today"))}${dayBtn(t1, T("Tomorrow"))}<label class="plan-date${other ? " on" : ""}"><input type="date" data-plan-date value="${esc(plan.day)}" aria-label="${T("Another day")}"><span>${esc(other ? dateFormat({ month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${plan.day}T12:00:00Z`)) : T("Other day"))}</span></label></div>
    ${results}
    <button type="button" class="acct-link plan-manual" data-manual>${T("Enter a trip yourself")}</button>
  </div>`;
}

// The rider's usual stations (where their trips start and end), most used first.
function usualStations() {
  const n = new Map();
  for (const r of trips || []) for (const k of [r.from_key, r.to_key]) if (k) n.set(k, (n.get(k) || 0) + 1);
  const out = new Map();
  for (const [k] of [...n].sort((a, b) => b[1] - a[1])) {
    const st = ctx.stationOfKey(k);
    if (st && !out.has(st.id)) out.set(st.id, st);
  }
  return [...out.values()].slice(0, 5);
}
function showSuggest(which, q) {
  const box = $(`[data-suggest="${which}"]`, sheet());
  if (!box) return;
  for (const other of sheet().querySelectorAll("[data-suggest]")) if (other !== box) other.hidden = true;
  const list = q.trim() ? ctx.searchStations(q) : usualStations();
  box.hidden = !list.length;
  box.innerHTML = (q.trim() ? "" : `<div class="plan-suggest-title">${T("Your stations")}</div>`) + list.map((st) =>
    `<button type="button" class="plan-option" data-suggest-pick="${esc(st.id)}" data-name="${esc(st.name)}" data-sub="${esc(st.sub)}"><span>${esc(st.name)}</span><small>${esc(st.sub)}</small></button>`).join("");
}
let planToken = 0;
async function searchPlan() {
  if (!plan.from || !plan.to) return render();
  const token = ++planToken;
  plan.loading = true;
  render();
  const r = await ctx.findTrains(plan.from.id, plan.to.id, plan.day).catch(() => ({ trains: [], exact: true }));
  if (token !== planToken || !plan) return;
  Object.assign(plan, { trains: r.trains, exact: r.exact, loading: false });
  render();
}
function pickTrain(r) {
  prefill = {
    agency: r.agency, number: r.number, route: r.route, service_date: plan.day,
    from_name: r.fromName, from_key: r.fromKey, to_name: r.toName, to_key: r.toKey,
    depart_at: r.departAt, arrive_at: r.arriveAt, status: plan.day < today() ? "taken" : "planned",
  };
  editing = null;
  view = "form";
  notice = "";
  render();
}

// The form's train number, once the railroad and day are set: its line,
// its stops offered for From and To (its first and last filled in), and
// the times at the stops chosen. A field the rider has typed in is left be.
let formRun = null; // { agency, number, day, run }
let autofillToken = 0;
async function autofill() {
  const f = $('form[data-form="trip"]', sheet() || undefined);
  if (!f) return;
  const agency = f.agency.value, number = f.number.value.trim(), day = f.service_date.value;
  if (!number || !day) { formRun = null; return; }
  const token = ++autofillToken;
  const runs = await ctx.trainRuns(agency, number, day).catch(() => []);
  if (token !== autofillToken || !f.isConnected) return;
  const run = runs[0];
  formRun = run ? { agency, run } : null;
  if (!run) return;
  const label = (s) => stationShown(agency, s.key, s.name);
  const set = (el, value) => { if (!el.value || el.value === el.dataset.auto) { el.value = value; el.dataset.auto = value; } };
  set(f.route, run.route || "");
  const list = $("#acct-stations");
  if (list) list.innerHTML = run.stops.map((s) => `<option value="${esc(label(s))}"></option>`).join("");
  set(f.from_name, label(run.stops[0]));
  set(f.to_name, label(run.stops[run.stops.length - 1]));
  fillTimes(f);
}
function fillTimes(f) {
  if (!formRun) return;
  const hhmm = (s) => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: s.tz || undefined }).format(new Date(s.at));
  for (const [name, time] of [["from_name", "depart"], ["to_name", "arrive"]]) {
    const typed = fold(f[name].value.trim());
    const s = formRun.run.stops.find((x) => fold(stationShown(formRun.agency, x.key, x.name)) === typed || fold(x.name) === typed);
    const el = f[time];
    if (s && (!el.value || el.value === el.dataset.auto)) { el.value = hhmm(s); el.dataset.auto = el.value; }
  }
}

// The form for a trip: railroad, train, day, from and to (the railroad's
// stations offered as you type), times, notes.
function tripForm(r) {
  const agencies = Object.entries(ctx.agencies).sort((x, y) => x[1].name.localeCompare(y[1].name));
  // The railroad open on the map, else the rider's latest trip's, else the first (Amtrak).
  const agency = r?.agency || ctx.defaultAgency() || trips?.[0]?.agency || Object.keys(ctx.agencies)[0];
  const local = (iso, key) => {
    if (!iso) return "";
    const f = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: ctx.stopTz(key) || ctx.agencies[agency]?.tz || undefined });
    return f.format(new Date(iso));
  };
  const status = r?.status || "planned";
  return `<form class="acct-form" data-form="trip">
    <label class="acct-field"><span>${T("Railroad")}</span><select name="agency">${agencies.map(([id, a]) =>
      `<option value="${esc(id)}"${id === agency ? " selected" : ""}>${esc(a.name)}</option>`).join("")}</select></label>
    <div class="acct-row">
      <label class="acct-field"><span>${T("Train")}</span><input name="number" inputmode="text" maxlength="20" placeholder="171" value="${esc(r?.number || "")}"></label>
      <label class="acct-field"><span>${T("Date")}</span><input name="service_date" type="date" required value="${esc(r?.service_date || today())}"></label>
    </div>
    <label class="acct-field"><span>${T("Line or train name")}</span><input name="route" maxlength="120" value="${esc(r?.route || "")}"></label>
    <div class="acct-row">
      <label class="acct-field"><span>${T("From")}</span><input name="from_name" list="acct-stations" maxlength="120" autocomplete="off" value="${esc(stationShown(agency, r?.from_key, r?.from_name))}"></label>
      <label class="acct-field acct-time"><span>${T("Leaves")}</span><input name="depart" type="time" value="${esc(local(r?.depart_at, r?.from_key))}"></label>
    </div>
    <div class="acct-row">
      <label class="acct-field"><span>${T("To")}</span><input name="to_name" list="acct-stations" maxlength="120" autocomplete="off" value="${esc(stationShown(agency, r?.to_key, r?.to_name))}"></label>
      <label class="acct-field acct-time"><span>${T("Arrives")}</span><input name="arrive" type="time" value="${esc(local(r?.arrive_at, r?.to_key))}"></label>
    </div>
    <datalist id="acct-stations"></datalist>
    <label class="acct-field"><span>${T("Notes")}</span><textarea name="notes" rows="2" maxlength="2000" placeholder="${T("Car, seat, who you traveled with…")}">${esc(r?.notes || "")}</textarea></label>
    <div class="segmented acct-status" role="radiogroup">${[["planned", T("Planned")], ["taken", T("Taken")], ["cancelled", T("Cancelled")]].map(([v, label]) =>
      `<label><input type="radio" name="status" value="${v}"${v === status ? " checked" : ""}><span>${label}</span></label>`).join("")}</div>
    <div class="acct-actions">
      ${r?.id ? `<button type="button" class="btn small acct-delete" data-delete-trip="${r.id}">${T("Delete trip")}</button>` : ""}
      <button class="btn primary" type="submit"${busy ? " disabled" : ""}>${r?.id ? T("Save") : T("Add trip")}</button>
    </div>
  </form>`;
}

// The railroad's stations, for the From and To fields (abroad, once its
// region's data is in).
async function fillStations() {
  const select = $('select[name="agency"]', sheet() || undefined);
  if (!select) return;
  const agency = select.value;
  await ctx.needData(agency);
  if ($('select[name="agency"]', sheet())?.value !== agency) return;
  const list = $("#acct-stations");
  if (list) list.innerHTML = stationChoices(agency).map((s) => `<option value="${esc(s.label)}"></option>`).join("");
}

// A railroad's stations as offered in the form: the name with its town
// ("Washington · Washington, MO", "Washington Union · Washington, DC"), since
// names repeat.
const stationChoices = (agency) => ctx.stationsOf(agency).map((s) => ({ ...s, label: s.place && s.place !== s.name ? `${s.name} · ${s.place}` : s.name }));
// A trip's stop as the form shows it again: as offered, when it's known.
const stationShown = (agency, key, name) => (key && stationChoices(agency).find((s) => s.key === key)?.label) || name || "";
// What was typed in From or To: a station as offered, or a name only one of
// the railroad's stations has; else just the text.
function stationTyped(agency, typed) {
  const text = String(typed || "").trim(), low = fold(text);
  if (!text) return { name: null, key: null };
  const all = stationChoices(agency);
  const hit = all.find((s) => fold(s.label) === low) || (() => {
    const named = all.filter((s) => fold(s.name) === low);
    return named.length === 1 ? named[0] : null;
  })();
  return hit ? { name: hit.name, key: hit.key } : { name: text, key: null };
}

// A time typed for a stop ("08:15") on the trip's day, in the stop's (or the
// railroad's) time zone, as an instant.
function instant(day, hhmm, tz) {
  if (!day || !hhmm) return null;
  const guess = Date.parse(`${day}T${hhmm}:00Z`);
  if (!tz) return new Date(`${day}T${hhmm}`).toISOString();
  // The zone's offset at that moment, by formatting the guess there.
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    .formatToParts(guess).map((p) => [p.type, p.value]));
  const shown = Date.parse(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00Z`);
  return new Date(guess - (shown - guess)).toISOString();
}

let changing = false; // the new-password view opened from the account, not a reset

async function sendReset(email) {
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: here() });
  if (error) throw error;
  resetEmail = email;
  view = "code";
  notice = T("If there's an account for {email}, an email with a code is on its way.", { email });
}

// ---------- Events ----------

async function run(fn) {
  if (busy) return;
  busy = true;
  notice = "";
  render();
  try {
    await fn();
  } catch (e) {
    notice = e?.message || String(e);
  } finally {
    busy = false;
    render();
  }
}

function onClick(e) {
  const b = e.target.closest("button, [data-close]");
  // A tap anywhere but a station field closes its suggestions.
  if (!e.target.closest(".plan-field")) for (const box of sheet()?.querySelectorAll("[data-suggest]") || []) box.hidden = true;
  if (e.target === sheet() || b?.dataset.close != null) return closeSheet();
  if (!b) return;
  const d = b.dataset;
  if (d.go) { view = d.go; notice = ""; editing = d.go === "form" ? editing : null; return render(); }
  if (d.tab) { tab = d.tab; return render(); }
  if (d.add != null) { editing = null; prefill = null; startPlan(); view = "plan"; notice = ""; return render(); }
  if (d.suggestPick) {
    const which = b.closest("[data-suggest]").dataset.suggest;
    plan[which] = { id: d.suggestPick, name: d.name, sub: d.sub };
    plan.typed[which] = "";
    searchPlan();
    if (!plan[which === "from" ? "to" : "from"]) $(`[data-plan="${which === "from" ? "to" : "from"}"]`, sheet())?.focus();
    return;
  }
  if (d.planSwap != null) {
    [plan.from, plan.to] = [plan.to, plan.from];
    [plan.typed.from, plan.typed.to] = [plan.typed.to, plan.typed.from];
    return searchPlan();
  }
  if (d.planDay) { plan.day = d.planDay; return searchPlan(); }
  if (d.pick) return pickTrain(plan.trains[Number(d.pick)]);
  if (d.manual != null) { prefill = null; editing = null; view = "form"; notice = ""; return render(); }
  if (d.edit) { editing = trips.find((r) => r.id === d.edit); view = "form"; notice = ""; return render(); }
  if (d.openTrain) { closeSheet(); return ctx.openTrain(d.openTrain); }
  if (d.provider) {
    return run(async () => {
      const { error } = await sb.auth.signInWithOAuth({ provider: d.provider, options: { redirectTo: here() } });
      if (error) throw error;
    });
  }
  if (d.changePassword != null) { view = "newpass"; changing = true; notice = ""; return render(); }
  if (d.resend != null) return run(() => sendReset(resetEmail));
  if (d.signout != null) return run(async () => { await sb.auth.signOut(); view = "signin"; });
  if (d.taken) {
    return run(async () => {
      const { error } = await sb.from("trips").update({ status: "taken" }).eq("id", d.taken);
      if (error) throw error;
      await loadTrips();
    });
  }
  if (d.deleteTrip) {
    if (!confirm(T("Delete this trip?"))) return;
    return run(async () => {
      const { error } = await sb.from("trips").delete().eq("id", d.deleteTrip);
      if (error) throw error;
      view = "trips";
      editing = null;
      await loadTrips();
    });
  }
  if (d.deleteAccount != null) {
    if (!confirm(T("Delete your Trainsheet account, with all your trips? This can't be undone."))) return;
    return run(async () => {
      const { error } = await sb.rpc("delete_my_account");
      if (error) throw error;
      await sb.auth.signOut({ scope: "local" });
      view = "signin";
      closeSheet();
      ctx.toast(T("Your account has been deleted."));
    });
  }
}

function onChange(e) {
  if (e.target.name === "agency") fillStations().then(() => autofill());
  if (e.target.name === "service_date") autofill();
  if (e.target.matches("[data-plan-date]") && e.target.value) { plan.day = e.target.value; searchPlan(); }
}
let typingTimer;
function onInput(e) {
  const which = e.target.dataset?.plan;
  if (which) {
    plan.typed[which] = e.target.value;
    plan[which] = null;
    plan.trains = null;
    return showSuggest(which, e.target.value);
  }
  const name = e.target.name;
  if (name === "number") { clearTimeout(typingTimer); typingTimer = setTimeout(autofill, 350); }
  if (name === "from_name" || name === "to_name") {
    const f = e.target.form;
    if (f) fillTimes(f);
  }
}
function onFocus(e) {
  const which = e.target.dataset?.plan;
  if (which && !e.target.value) showSuggest(which, "");
}

// This page's address without its query, where sign-in links come back to
// (allowed under Authentication › URL Configuration in Supabase).
const here = () => location.origin + location.pathname;

function onSubmit(e) {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  const kind = e.target.dataset.form;
  run(async () => {
    if (kind === "signin") {
      const { error } = await sb.auth.signInWithPassword({ email: f.email, password: f.password });
      if (error) throw error;
    } else if (kind === "signup") {
      const { data, error } = await sb.auth.signUp({ email: f.email, password: f.password, options: { emailRedirectTo: here() } });
      if (error) throw error;
      if (!data.session) { view = "signin"; notice = T("Check your email for a link to confirm your account."); }
    } else if (kind === "reset") {
      await sendReset(f.email);
    } else if (kind === "code") {
      const { error } = await sb.auth.verifyOtp({ email: resetEmail, token: f.token.replace(/\s/g, ""), type: "recovery" });
      if (error) throw new Error(T("That code didn't work. Check it, or send a new one."));
      // Signed in by the code: now the new password (authChanged keeps this view).
      view = "newpass";
      changing = false;
    } else if (kind === "newpass") {
      const { error } = await sb.auth.updateUser({ password: f.password });
      if (error) throw error;
      view = "trips";
      changing = false;
      ctx.toast(T("Your password has been changed."));
      if (trips === null) loadTrips();
    } else if (kind === "trip") {
      const from = stationTyped(f.agency, f.from_name), to = stationTyped(f.agency, f.to_name);
      const tz = ctx.agencies[f.agency]?.tz;
      const row = {
        agency: f.agency, number: f.number.trim() || null, route: f.route.trim() || null, service_date: f.service_date,
        from_name: from.name, from_key: from.key, to_name: to.name, to_key: to.key,
        depart_at: instant(f.service_date, f.depart, ctx.stopTz(from.key) || tz),
        arrive_at: instant(f.service_date, f.arrive, ctx.stopTz(to.key) || tz),
        status: f.status || "planned", notes: f.notes.trim() || null,
      };
      // A trip's arrival past midnight is on the next day.
      if (row.depart_at && row.arrive_at && row.arrive_at < row.depart_at) row.arrive_at = new Date(Date.parse(row.arrive_at) + 86400000).toISOString();
      const { error } = editing ? await sb.from("trips").update(row).eq("id", editing.id) : await sb.from("trips").insert(row);
      if (error) throw error;
      tab = isUpcoming(row) ? "upcoming" : "history";
      view = "trips";
      editing = null;
      prefill = null;
      await loadTrips();
    }
  });
}

// ---------- What js/app.js calls ----------

const api = {
  get user() { return user; },
  open() {
    if (user && view !== "newpass") view = "trips";
    if (!user && !["signin", "signup", "reset", "code"].includes(view)) view = "signin";
    openSheet();
  },
  trackedChanged,
  logRide,
  today,
  // For the home screen (js/app.js): null until the trips are in.
  upcoming: () => (trips ? trips.filter(isUpcoming).sort(byWhen) : null),
  taken: () => (trips ? trips.filter((r) => r.status === "taken") : null),
  // Your trips, on one tab; a trip's form; a new trip's.
  openTrips(which = "upcoming") {
    tab = which;
    api.open();
  },
  editTrip(id) {
    const r = trips?.find((x) => x.id === id);
    if (!r) return api.open();
    editing = r;
    view = "form";
    notice = "";
    openSheet();
  },
  addTrip() {
    if (!user) return api.open();
    editing = null;
    prefill = null;
    startPlan();
    view = "plan";
    notice = "";
    openSheet();
  },
};
