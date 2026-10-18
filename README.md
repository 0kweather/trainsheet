# Trainsheet

A live map of passenger trains across the United States and Canada: Amtrak, VIA and Brightline plus the commuter railroads that publish real-time positions, and railroads in thirteen more countries whose live positions are public, all on one map.

**Live site:** https://0kweather.github.io/trainsheet/

## What's on the map

Grouped by country. The only keys are the free ones marked "free key" (Metra, 511 SF Bay, Metrolink), which the relay sends once set; every railroad outside the US and Canada uses public data that needs no key, registration or approval.

### United States

| Railroad | Region | Feed | Needs |
| --- | --- | --- | --- |
| Amtrak, Brightline (and VIA Rail, below) | Nationwide | [Amtraker API](https://amtraker.com) | — |
| MBTA Commuter Rail | Boston | MBTA V3 API | — |
| Long Island Rail Road | New York | MTA GTFS-realtime | — |
| Metro-North | New York | MTA GTFS-realtime (positions estimated from predicted times) | — |
| SEPTA Regional Rail | Philadelphia | SEPTA TrainView | relay |
| RTD commuter rail (A, B, G, N) | Denver | RTD GTFS-realtime | relay |
| FrontRunner | Salt Lake City | UTA GTFS-realtime | relay |
| CapMetro Rail | Austin | CapMetro GTFS-realtime | relay |
| Tri-Rail | South Florida | Tri-Rail GTFS-realtime | relay |
| Metra | Chicago | Metra GTFS-realtime | relay + free key |
| NJ Transit Rail | New Jersey | NJ Transit DepartureVision (scraped; positions estimated from predicted times) | relay |
| CT Rail (Hartford Line, Shore Line East) | Connecticut | CTDOT's timetable (`scripts/build_ct.py`), with delays, tracks and cancellations from MTA TrainTime's New Haven board; positions estimated | direct |
| Caltrain, SMART | Bay Area | 511 SF Bay | relay + free key |
| Metrolink | Los Angeles | Metrolink GTFS-realtime | relay + free key |
| MARC | Maryland | MARC GTFS-realtime | relay |
| Virginia Railway Express | Northern Virginia | VRE GTFS-realtime | relay |
| Sounder | Seattle | Sound Transit GTFS-realtime (OneBusAway; its terms ask for a free key, sent once set) | relay |
| South Shore Line | Chicago–South Bend | South Shore's ETA SPOT tracker, plus its timetable (`scripts/build_schedules.py`) | direct |
| SunRail | Orlando | sunrail.com's train status, plus its timetable | direct |
| Rail Runner Express | New Mexico | Timetable only (no live data published); positions estimated | direct |
| ACE (Altamont Corridor Express) | Stockton–San Jose | 511 SF Bay GTFS-realtime | relay + free key |
| Coaster, Sprinter | San Diego | NCTD's timetable; positions estimated (live data needs a Swiftly key) | direct |
| Trinity Railway Express, TEXRail, DART Silver Line, A-train | Dallas–Fort Worth | Each railroad's timetable; positions estimated (no public live data) | direct |
| WeGo Star | Nashville | WeGo's timetable; positions estimated (not in WeGo's live feed) | direct |
| Alaska Railroad | Anchorage–Fairbanks | The Alaska Railroad's timetable; positions estimated | direct |

### Canada

| Railroad | Region | Feed | Needs |
| --- | --- | --- | --- |
| VIA Rail | Nationwide | [Amtraker API](https://amtraker.com) | — |
| GO Transit | Toronto | GO Tracker (scraped) plus GO's timetable (`scripts/build_go.py`) | relay |
| UP Express | Toronto | Metrolinx's timetable; positions estimated (not in GO Tracker) | direct |
| exo | Montréal | exo.quebec's live map (scraped by the relay), plus exo's timetable | relay |
| Polar Bear Express (Ontario Northland) | Cochrane–Moosonee | Ontario Northland's timetable; positions estimated | direct |

### Elsewhere

Each of these is a plug-in (`scripts/railroads/<id>.py`, parsed by `js/railroads/<id>.js`), and its stations, departures, first trains and track live in `data/regions/<region>/` and `data/rail/<region>.geojson`, fetched only when the map, a search or a shared link reaches that country. Its feed is polled only while the railroad is in view (or one of its trains is open), so a viewer elsewhere asks for none of it.

| Country | Railroad | Region | Feed | Needs |
| --- | --- | --- | --- | --- |
| Argentina | Trenes Argentinos (Roca, Sarmiento, Mitre, San Martín, Belgrano Sur, Tren de la Costa) | Buenos Aires | SOFSE's station arrivals (GPS positions), 21 stations gathered by the relay; Buenos Aires Data's timetable for stations and lines only (it ran out in 2020, so no "later today") | relay |
| Australia | Queensland Rail City network | Brisbane, South East Queensland | Translink GTFS-realtime (rail) | relay |
| Australia | Adelaide Metro trains | Adelaide | Adelaide Metro GTFS-realtime, kept to the train routes by the relay | relay |
| Czechia | České dráhy, RegioJet, Leo Express, Arriva vlaky, GW Train Regio | Czechia | The Oběhy project's GTFS and GTFS-realtime of the national CZPTT timetable and SŽ's positions | relay |
| Estonia | Elron | Estonia | Elron's own live map (elron.ee), plus the ministry's timetable | relay |
| Finland | VR (long distance), commuter trains (HSL and VR) | Finland | Fintraffic's Digitraffic train locations and GTFS-realtime trip updates | relay |
| Greece | Hellenic Train | Athens–Thessaloniki axis | railway.gov.gr's public live train tracker (read by the relay), with its timetable as Transitous's GTFS | relay |
| Ireland | Irish Rail (InterCity, DART, Commuter) | Ireland | Iarnród Éireann's realtime API (positions from signalling), plus the NTA's timetable | relay |
| Israel | Israel Railways | Israel | The Ministry of Transport's SIRI positions as Hasadna's Open Bus Stride API keeps them (about two minutes behind) | relay |
| Latvia | Vivi | Latvia | The Pieturas app's Baltic GTFS-realtime (Vivi's trains only), plus Vivi's timetable | relay |
| Malaysia | KTMB (ETS, Intercity), KTM Komuter | Peninsular Malaysia | data.gov.my GTFS-realtime (positions only; fetched by each browser, since the API allows 4 requests a minute per address) | direct |
| Norway | Vy, Go-Ahead Norge, Flytoget, SJ Nord | Norway | Entur GTFS-realtime (SJ Nord sends no positions: placed from its timetable, with Bane NOR's delays) | relay |
| Slovakia | ZSSK, RegioJet, Leo Express | Slovakia | Community GTFS-realtime (jbb.ghsq.de, station reports), plus ŽSR's timetable | relay |
| Spain | Renfe (AVE, Avlo, Alvia, Avant, Euromed, regional), Renfe Cercanías and Rodalies | Spain | Renfe's open GTFS-realtime | relay |
| Spain | FGC (Barcelona–Vallès, Llobregat–Anoia) | Catalonia | FGC's Geotren positions on its open-data portal | relay |

"Relay" feeds don't send the CORS headers a browser needs, and keyed feeds can't put their key in a public web page, so both go through a tiny Cloudflare Worker (below). Without it, the site still shows everything marked "—" (and KTMB, which each browser fetches itself).

Northstar (Minneapolis) ended rail service; its route is now a bus, so it isn't shown. Ontario Northland's Northlander is in its timetable file ahead of its return but isn't carrying passengers yet, so only the Polar Bear Express is shown. Trains that Amtrak runs or that share Amtrak's feed (e.g., Amtrak's own Hartford Line and Valley Flyer trips) do show up.

**Not yet covered:**
- West Coast Express and WES: they need keys.
- Ontario Northland's live feed: its GTFS-realtime carries only motor coaches (no Polar Bear position has been seen), and its stations sit inside the default US view, so a live source would be polled for every US viewer. The Polar Bear stays placed from its timetable.
- Tshiuetin (Sept-Îles–Schefferville): its only live source is a Samsara fleet viewer whose robots.txt and terms forbid automated access, and its timetable is posted only as monthly images.
- MÁV and GYSEV (Hungary): the live positions on mavplusz.hu work without a key, but MÁV's legal notice forbids storing or republishing the site's content, and its own GTFS needs registration.

## Using it

- **Stations:** every station on these railroads is on the map (intercity stops from regional zoom, commuter stops once you zoom into a metro area). Click one, or search for it, to see which railroads and lines serve it and the next trains due, with live predicted times and delays. Stations shared by several railroads, like New York Penn or Boston South Station, appear as one stop. MBTA stations show the MBTA's own live predictions. Arrivals say where each train is now (its next stop, or the station it's standing at).
- **Near you.** The home list opens with the trains closest to you: press "Find trains near me" and the five nearest (within 100 miles) are listed with how far away each is, whether it's coming your way, its next stop and how late it is, each with a Track button that asks where you're getting off. Your location is asked for only when you press it (and, once allowed, on later visits), stays on your device and is never sent anywhere; the list follows the trains as they move and checks your location again every couple of minutes.
- **Trains later today.** Search also finds trains that haven't left yet: those still to leave today (each railroad's own today) that match the words searched, by number, railroad, line, or first or last station, with when and where each leaves; tap one for its stops and times. From every railroad's timetable (`scripts/build_schedules.py`, rebuilt weekly into `data/schedules/` and indexed in `data/departures.json`); Brightline publishes none, and Tri-Rail's ran out in 2025.
- **Usual tracks.** At the big terminals a track goes up only minutes before a train leaves. The relay notes every track posted at New York Penn, Grand Central, Atlantic Terminal and Jamaica (LIRR), Grand Central (Metro-North), and New York Penn, Hoboken, Newark Penn and Secaucus (NJ Transit), once per train per day. Until a train's real track is posted, its row shows a dashed track: the one it has used on at least 60% of its last ten recorded days (or two tracks between them on 80%), with the count in its tooltip. Amtrak isn't covered, since Amtraker almost never has its platforms. Needs the relay.
- **Disruptions on the map.** Where a railroad says no trains are running right now (service suspended, or buses replacing trains), that stretch of track loses its colored strands for a thin broken line in the railroad's color, labeled ("Buses replace trains") once zoomed in; hover or tap it for the railroad's notice. A station the stretch leaves with no trains of that railroad says so on its page ("No Metro-North trains here right now", with the notice), and its row in Served by reads "No trains right now"; a station at the end that trains still reach from the other side (Southeast, for "between Southeast and Wassaic") doesn't. From the MTA's LIRR and Metro-North alerts and the MBTA's, refreshed every five minutes (`js/disruptions.js`). A stretch runs between the stations the notice names (or lists), trimmed to stations only the affected lines serve, so track other trains still use isn't marked.
- **Tracking.** A train's page has a **Track** button. It asks where you're getting off (the stops ahead, the last one chosen to begin with), then the train stays pinned at the top with a countdown to your stop, and you're told when it gets there. Tap "Tracking to …" to change the stop or stop tracking.
- **Status, one way everywhere.** A train under five minutes late is on time (green); five minutes or more is late (orange); red is kept for a train that isn't running. In the stop list a later time shows with the timetable's beside it, struck through.
- **The map.** Roads, buildings and land use stay in the background so the rail lines carry the color. A selected train shows alone on the map, its route lit up in its line's color: solid ahead, faded behind; closing its page (or tapping the map) brings the other trains back, from a tracked train too. Taps pick the nearest train within a finger's width.
- **Which train am I on?** Press the locate button while riding. For the next 30 seconds Trainsheet watches your location; if you're moving faster than 15 mph and a train on the map is where you are, heading your way (and about as fast, where it reports a speed), a card asks whether you're on it. "Track this ride" opens it and asks where you're getting off. Your location stays in the browser.
- **Settings** (gear button): light/dark/auto appearance, **Units** (miles or kilometers, for speeds and distances; the default follows your browser's language), **Show stations**, **Infer direction**, **Time zone** (your own by default, or each station's local time, or a chosen zone), **Catch unreported delays**, and **Colorblind-friendly** (statuses in blue and orange, with a circle for on time and a triangle for late).
- **Inferred direction.** Trains whose feed has no heading (Caltrain, some SMART and Metrolink trains, among others) are pointed along the track the way the route to their next stop leads; the heading chip on their page is underlined with dots. It can be turned off in Settings, and those trains then show as dots.
- **Consist.** A train's page draws its cars right under its status. Where the railroad reports car numbers, they're matched to its published fleet roster: every car in order for SEPTA. Numbers outside the roster aren't drawn. Everywhere else, including Amtrak, VIA and LIRR/MBTA trains where only one car is named, the page shows the equipment that typically runs on that route, marked with an eye icon whose tip says the car count and types may not be accurate. Typical sets come from each route's published equipment assignments (as summarized on Wikipedia), and the one car LIRR or MBTA names picks between electric and diesel or bi-level and single-level fleets. Married pairs face outward, with their cabs at the pair's ends; single cars get a cab at each end. The drawings are Trainsheet's own: hand-written SVG geometry built from each model's published dimensions (length, height, truck centers, wheel size, door positions) and checked against photographs, all at one scale of 3 px per foot, so a locomotive stands in true proportion to its cars. Liveries follow each railroad's current paint. No public-domain side views of these trains exist, and the ones on Wikimedia Commons are CC BY-SA, so nothing is traced or copied.
- **Unreported delays.** Railroads often keep showing a train on time well after it's fallen behind. Trainsheet checks each GPS fix against the posted times: a train still at the platform after its posted departure (and not moving), or still too far from its next stop to make the posted arrival even running at 1.5× its scheduled pace, is at least that late. Trainsheet only counts delay the GPS proves, never extrapolates past the last fix, and pushes later stops back by the timetable's running times unless the feed already shows them later. These delays are underlined with dots, and the train page says what the GPS showed. Works for Amtrak, VIA and LIRR trains reporting GPS. Brightline is skipped because its feed doesn't say when a position was taken. It's on by default and can be turned off in Settings (`js/delays.js`).
- **Rail lines are colored by network.** Each stretch of track takes the color of the railroads that run passenger trains on it, and shared track (Amtrak and Metro-North on the New Haven Line, for example) is drawn as side-by-side strands, one per railroad. Hover a line to see who runs on it. Railroads come from USDOT's track ownership and trackage-rights codes, plus the nearest commuter station for commuter trains on freight-owned track.
- **Trains sit on the track.** Reported positions are snapped to the nearest rail line within 1.5 km, preferring the train's own railroad when it's about as close. The rail lines form a graph, so trains placed from the timetable (Metro-North) and slide animations follow the track between two points (a shortest-path route) instead of cutting across curves.
- **Stations sit on the track** too: each is drawn at the nearest point on its railroad's track within 400 m. Terminals like Boston South Station, whose tracks end short of the building, sit at the end of the platforms.
- **Main line only.** Yard tracks, sidings and spurs are left out (from both the passenger network and the basemap), so big terminals don't turn into a tangle.
- Trains are arrows pointing the way they're headed. Zoomed out, they're unlabeled so the map stays readable; names appear once you zoom in, and labels that would overlap are hidden instead of piling up.
- Search by train number, line, or city. Click a train for its status, next stop, speed and full stop list. The URL updates so you can share a specific train.
- Toggle railroads on or off and filter to intercity or commuter.

## Running locally

It's a static site with no build step:

```bash
python3 -m http.server 8000
```

then open http://localhost:8000. To try the relay feeds locally, run `python3 scripts/dev_relay.py` and set `window.TRAINSHEET_RELAY = "http://127.0.0.1:8787"` in `config.js`.

## Turning on the relay feeds

1. Create a free Cloudflare account and install Wrangler (`npm i -g wrangler`). Deploy with Wrangler, not by pasting into the dashboard: `relay/worker.js` imports the plug-ins' feeds from `relay/feeds/index.js` (generated by `scripts/gen_registry.py`) and their fetchers in `relay/feeds/`, which only Wrangler bundles.
2. From `relay/`, run `wrangler deploy`.
3. Optional keys (all free), set with `wrangler secret put NAME`:
   - `METRA_API_TOKEN`: https://metra.com/developers
   - `API_511_KEY`: https://511.org/open-data/token (Caltrain + SMART)
   - `METROLINK_API_KEY`: https://metrolinktrains.com/about/gtfs/

   No railroad outside the US and Canada needs one.
4. Put the Worker's URL in `config.js` (`window.TRAINSHEET_RELAY = "https://trainsheet-relay.<you>.workers.dev"`) and push.

The relay only serves the feeds listed in `relay/worker.js` and `relay/feeds/index.js` (it is not an open proxy) and caches each one for 15 seconds, or for the time a plug-in's `RELAY` entry sets (`ttl`, 15 to 60 seconds), so a feed's server sees the same few requests however many people watch. Plug-in feeds send an identifying User-Agent. A Cron Trigger (every five minutes, in `wrangler.toml`) records the tracks posted at the big terminals in the Worker's Durable Object, for usual tracks; it keeps three weeks.

## Project layout

```
index.html, css/, js/     the site (MapLibre GL + OpenFreeMap basemap)
js/sources.js             one adapter per feed → common train objects
js/gtfsrt.js              small dependency-free GTFS-realtime decoder
data/mta.json             LIRR/Metro-North station + branch lookups
data/rail.geojson         US and Canadian passenger main lines (USDOT NTAD) tagged by network, merged into continuous lines
data/stations.json        stations for every railroad (NTAD, Amtraker, agency GTFS)
js/stations.js            station merging and "next trains" lookups
js/delays.js              delays the GPS proves but the railroad hasn't posted
js/consist.js             fleet rosters and typical equipment for a train's cars
js/carmodels.js           side-view drawings of each locomotive and car model
js/carart.js              drawing toolkit: trucks, windows, doors, pantographs, scale
js/estimate.js            rail index: snapping to track and routing along it
js/networks.js            rail network names and colors
scripts/                  rebuild the data files; local dev relay
scripts/railroads/        one plug-in per railroad outside the built-in set: agencies, feeds, timetable, track
js/railroads/             their parsers (index.js generated by scripts/gen_registry.py)
data/regions/, data/rail/ stations, departures, first trains and track of each country outside the US and Canada
relay/                    Cloudflare Worker for CORS-less and keyed feeds
relay/feeds/              the plug-ins' relay feeds (index.js generated) and their own fetchers
```

Deploys run through `.github/workflows/pages.yml`, which stamps every file reference (`?v=dev` in the source) with the commit ID so browsers never mix cached files from different versions.

Refresh the static data occasionally with `python3 scripts/build_static.py`, `python3 scripts/build_stations.py` (`.github/workflows/stations.yml` also rebuilds the stations every Monday afternoon), then `python3 scripts/build_rail.py` (it uses the stations), and `python3 scripts/build_trips.py` (stop and trip lookups for Caltrain, SMART, Metrolink, RTD and CapMetro; it uses the stations too); the workflow runs neither of those two, so run them by hand when a station changes.

Map data © OpenStreetMap contributors, tiles by OpenFreeMap. Train data from the agencies listed above. Rail lines from the USDOT/BTS National Transportation Atlas Database; outside the US and Canada, from OpenStreetMap (© OpenStreetMap contributors, ODbL), built by `scripts/build_rail.py`.

Data outside the US and Canada, credited on the map with each railroad:
- Fintraffic / digitraffic.fi, CC BY 4.0 (Finland).
- Entur, NLOD, the Norwegian Licence for Open Government Data (Norway).
- Renfe (data.renfe.com), CC BY 4.0; FGC Open Data (dadesobertes.fgc.cat), CC BY 4.0 (Spain).
- Iarnród Éireann's realtime API; National Transport Authority / Transport for Ireland timetable, CC BY 4.0 (Ireland).
- Translink (Queensland), CC BY 4.0; Adelaide Metro – Department for Infrastructure and Transport, South Australia, CC BY 3.0 AU (Australia).
- data.gov.my, CC BY 4.0 (Malaysia).
- ŽSR timetable (data.slovensko.sk), CC BY 1.0; live positions from jbb.ghsq.de (Slovakia).
- Buenos Aires Data timetable, CC BY 2.5 AR; live data from SOFSE / Trenes Argentinos (Argentina).
- Elron and the Regionaal- ja Põllumajandusministeerium, timetable CC0 (Estonia).
- Vivi timetable and Pieturas live data (gsvalbe.id.lv), credited as Pieturas asks (Latvia).
- Oběhy (SŽ, CIS JŘ) (Czechia); railway.gov.gr (Greece); Ministry of Transport and Hasadna Open Bus (Israel): no licence published. Railroad logos on the train drawings (`img/logos/`) are the railroads' trademarks, from the public-domain versions on Wikimedia Commons.
