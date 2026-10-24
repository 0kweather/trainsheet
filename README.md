# Trainsheet

A live map of passenger trains across the United States and Canada: Amtrak, VIA and Brightline plus the commuter railroads that publish real-time positions, and railroads in twenty more countries: those whose live positions are public, Italy's from its timetables, and those (Australia's New South Wales and Victoria, New Zealand, Sweden, Switzerland) whose free keys switch on live positions or delays, placed from their timetables until then; all on one map.

**Live site:** https://0kweather.github.io/trainsheet/

## What's on the map

Grouped by country. The only keys are the free ones marked "free key", which the relay sends once set (the list is under [Turning on the relay feeds](#turning-on-the-relay-feeds)). Until its key is set, a keyed railroad that has a public timetable is placed from that timetable, its page saying so ("Placed from the timetable until its API key is set"), and switches to its live feed the moment the relay has the key. Every other railroad uses public data that needs no key, registration or approval.

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
| Coaster, Sprinter | San Diego | NCTD GTFS-realtime through Swiftly; until the key is set, NCTD's timetable, positions estimated | relay + free key |
| A-train | Denton | DCTA GTFS-realtime through Swiftly; until the key is set, DCTA's timetable, positions estimated | relay + free key |
| Trinity Railway Express, TEXRail, DART Silver Line | Dallas–Fort Worth | Each railroad's timetable; positions estimated (no public live data) | direct |
| WES Commuter Rail | Portland | TriMet GTFS-realtime; until the key is set, TriMet's timetable | relay + free key |
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
| West Coast Express | Vancouver | TransLink GTFS-realtime; until the key is set, TransLink's timetable (TransLink's live feeds may carry buses only, so it may stay timetable-placed) | relay + free key |

### Elsewhere

Each of these is a plug-in (`scripts/railroads/<id>.py`, parsed by `js/railroads/<id>.js`), and its stations, departures, first trains and track live in `data/regions/<region>/` and `data/rail/<region>.geojson`, fetched only when the map, a search or a shared link reaches that country. Its feed is polled while the area its stations cover (padded by a quarter) is in view, or one of its trains is open or tracked; a search or a shared link fetches every such feed once, and every region's stations and timetables. A railroad whose trains run abroad covers a wide area, so its feed is polled from next door too: ZSSK's reaches Vienna, Berlin and Hamburg, Vy's Copenhagen and Gothenburg. A viewer who neither searches nor looks outside the US and Canada asks for none of it.

| Country | Railroad | Region | Feed | Needs |
| --- | --- | --- | --- | --- |
| Argentina | Trenes Argentinos (Roca, Sarmiento, Mitre, San Martín, Belgrano Sur, Tren de la Costa) | Buenos Aires | SOFSE's station arrivals (GPS positions), 21 stations gathered by the relay; Buenos Aires Data's timetable for stations and lines only (it ran out in 2020, so no "later today") | relay |
| Australia | Queensland Rail City network | Brisbane, South East Queensland | Translink GTFS-realtime (rail) | relay |
| Australia | Adelaide Metro trains | Adelaide | Adelaide Metro GTFS-realtime, kept to the train routes by the relay | relay |
| Australia | Sydney Trains, NSW TrainLink (intercity lines, XPT, Xplorer, Endeavour, Hunter) | New South Wales | Transport for NSW GTFS-realtime (Sydney Trains v2 with each train's set type, NSW Trains v1); placed from TfNSW's timetable until the key is set | relay + free key |
| Australia | Metro Trains Melbourne, V/Line | Victoria | Transport Victoria GTFS-realtime (Metro's whole train, V/Line's lead unit); placed from its timetable until the key is set | relay + free key |
| Belgium | SNCB/NMBS (IC, L, P, the S trains of Brussels, Antwerp, Ghent, Liège and Charleroi, EuroCity Brussels–Rotterdam, the trains to Luxembourg, Lille, Maastricht, Aachen and Roosendaal), and DB's ICE, ÖBB's Nightjet and SNCF's OUIGO Train Classique into Belgium | Belgium | Placed from SNCB's timetable (GTFS on Belgium's National Access Point) and DELFI's for the ICEs, with an opened train's delays, platforms and composition, car by car, from iRail | relay (for an opened train's details) |
| Bulgaria | БДЖ – Пътнически превози (Бърз влак, Пътнически влак, Крайградски пътнически влак, Международен бърз влак, the Rhodope narrow gauge) | Bulgaria | Placed from BDZ's timetable (GTFS on Bulgaria's National Access Point, BGNAP) and moved by the NAP's GTFS-realtime trip updates and positions (each position is the timetable's place shifted by BDZ's reported delay, so it's read for the delay) | relay |
| Czechia | České dráhy, RegioJet, Leo Express, Arriva vlaky, GW Train Regio | Czechia | The Oběhy project's GTFS and GTFS-realtime of the national CZPTT timetable and SŽ's positions | relay |
| Estonia | Elron | Estonia | Elron's own live map (elron.ee), plus the ministry's timetable | relay |
| Finland | VR (long distance), commuter trains (HSL and VR) | Finland | Fintraffic's Digitraffic train locations and GTFS-realtime trip updates | relay |
| Greece | Hellenic Train | Athens–Thessaloniki axis | railway.gov.gr's public live train tracker (read by the relay), with its timetable as Transitous's GTFS | relay |
| Ireland | Irish Rail (InterCity, DART, Commuter) | Ireland | Iarnród Éireann's realtime API (positions from signalling), plus the NTA's timetable | relay |
| Israel | Israel Railways | Israel | The Ministry of Transport's SIRI positions as Hasadna's Open Bus Stride API keeps them (about two minutes behind) | relay |
| Italy | Trenitalia (Frecce, Intercity, regional trains, Trenitalia Tper's among them), Italo | Italy | Placed from the national timetables Italy's National Access Point publishes (NeTEx, cciss.it) | — |
| Italy | Trenord, South Tyrol's trains (SAD, ÖBB), EAV (Naples), ARST (Sardinia), Trento–Malè–Mezzana | Lombardy, South Tyrol, Campania, Sardinia, Trentino | Placed from each one's open GTFS timetable | — |
| Latvia | Vivi | Latvia | The Pieturas app's Baltic GTFS-realtime (Vivi's trains only), plus Vivi's timetable | relay |
| Luxembourg | CFL (RE, RB, IC, and the TER and TGV to Thionville and Metz) | Luxembourg | Placed from Luxembourg's national timetable (GTFS, data.public.lu); the trains over the Belgian border come with SNCB's | — |
| Malaysia | KTMB (ETS, Intercity), KTM Komuter | Peninsular Malaysia | data.gov.my GTFS-realtime (positions only; fetched by each browser, since the API allows 4 requests a minute per address) | direct |
| Netherlands | NS (Intercity, Intercity direct, Sprinter), the regional railways (Arriva, Blauwnet, RRReis, R-net), and the international trains (ICE, Eurostar, Nightjet, EuroCity, European Sleeper, GoVolta, and VIAS's, eurobahn's, DB's and NMBS's trains over the border) | Netherlands | Placed from OVapi's national timetable (GTFS) and moved by its GTFS-realtime trainUpdates (NS's InfoPlus delays, cancellations and skipped stops for every railway's trains) | relay |
| New Zealand | AT Metro, Te Huia | Auckland, Hamilton–Auckland | Auckland Transport GTFS-realtime (trains only, with their units); placed from AT's timetable until the key is set | relay + free key |
| New Zealand | Metlink (Kāpiti, Hutt Valley, Melling, Johnsonville, Wairarapa) | Wellington | Metlink GTFS-realtime (rail); placed from Metlink's timetable until the key is set | relay + free key |
| Norway | Vy, Go-Ahead Norge, Flytoget, SJ Nord | Norway | Entur GTFS-realtime (SJ Nord sends no positions, and Entur's GTFS-realtime has none of its delays yet: placed from its timetable, shown as scheduled) | relay |
| Portugal | CP – Comboios de Portugal (Alfa Pendular, Intercidades, InterRegional, Regional, Urbanos de Lisboa, Porto and Coimbra), Fertagus | Portugal | Placed from CP's and Fertagus's timetables (GTFS on Portugal's National Access Point) | — |
| Romania | CFR Călători (InterCity, InterRegio, InterRegio Noapte, Regio, Regio-Expres, Regio Metropolitan), Regio Călători, InterRegional Călători, Transferoviar Călători, Astra Trans Carpatic, Softrans, Ferotrafic TFI | Romania | Placed from Informatica Feroviară's yearly timetables (each railroad's XML on data.gov.ro, converted here; where data.gov.ro can't be reached, as it can't from North America, Transitous's GTFS of the same files, its running days put right) | — |
| Slovakia | ZSSK, RegioJet, Leo Express | Slovakia | Community GTFS-realtime (jbb.ghsq.de, station reports), plus ŽSR's timetable | relay |
| Spain | Renfe (AVE, Avlo, Alvia, Avant, Euromed, regional), Renfe Cercanías and Rodalies | Spain | Renfe's open GTFS-realtime | relay |
| Spain | FGC (Barcelona–Vallès, Llobregat–Anoia) | Catalonia | FGC's Geotren positions on its open-data portal | relay |
| Sweden | SJ, Snälltåget, Tågab, VR Snabbtåg (ex-MTRX), Arlanda Express, SL Pendeltåg, Mälartåg, Östgötapendeln, Tåg i Bergslagen, Norrtåg, Värmlandstrafik, X-Tåget, Pågatåg, Öresundståg, Västtågen, Krösatåg | Sweden | Trafikverket's open API (train positions and announcements, joined by the relay); placed from Samtrafiken's GTFS Sweden 3 timetable until the key is set | relay + free key |
| Switzerland | SBB (long distance; regional, S-Bahns, Léman Express, TILO), BLS, Südostbahn, Thurbo, RegionAlps, TPF, Rhätische Bahn, Matterhorn Gotthard Bahn, Zentralbahn, MOB, the other metre-gauge and rack railways (RBS, Appenzeller Bahnen, BOB, WAB, Jungfraubahn, Gornergrat, Rigi, Pilatus and more), and DB's, ÖBB's and SNCF's trains into Switzerland (ICE, TGV Lyria, Railjet, Nightjet, TER) | Switzerland | Placed from the national timetable (GTFS, opentransportdata.swiss) and moved by its GTFS-realtime trip updates (delays, cancellations, skipped stops; no positions are published), with an opened train's formation, car by car, from the Train Formation Service; placed from the timetable until the keys are set | relay + free keys |

"Relay" feeds don't send the CORS headers a browser needs, and keyed feeds can't put their key in a public web page, so both go through a tiny Cloudflare Worker (below). Without it, the site still shows everything marked "—" or "direct" (fetched by each browser itself, as KTMB is, or placed from the timetable).

Northstar (Minneapolis) ended rail service; its route is now a bus, so it isn't shown. Ontario Northland's Northlander is in its timetable file ahead of its return but isn't carrying passengers yet, so only the Polar Bear Express is shown. Trains that Amtrak runs or that share Amtrak's feed (e.g., Amtrak's own Hartford Line and Valley Flyer trips) do show up.

**Not yet covered:**
- Ontario Northland's live feed: its GTFS-realtime carries only motor coaches (no Polar Bear position has been seen), and its stations sit inside the default US view, so a live source would be polled for every US viewer. The Polar Bear stays placed from its timetable.
- Tshiuetin (Sept-Îles–Schefferville): its only live source is a Samsara fleet viewer whose robots.txt and terms forbid automated access, and its timetable is posted only as monthly images.
- Italo's live data: its tracker's terms (italotreno.com, Note legali §7) allow only personal, non-commercial use, so Italo is placed from its timetable alone. Italy publishes no live train positions openly; ViaggiaTreno's own terms forbid reusing its data, and a Rome court (Trenitalia v. GoBright, 4 September 2019) allowed it only "in misura non sostanziale", so the relay can ask it for one opened train at a time and never polls it (relay/feeds/viaggiatreno.js); that's switched off for now, because ViaggiaTreno's CDN refuses every request from Cloudflare's network.
- CP's and Infraestruturas de Portugal's live data (Portugal): CP's live times come from an API keyed for its own site, and IP's train-running pages are closed to automated access by its robots.txt and its terms (content only for personal information, reuse only with IP's written consent), so CP and Fertagus are placed from their timetables.
- Romania's live positions: Informatica Feroviară's maps (bilete.infofer.ro, mersultrenurilor.infofer.ro) publish no open feed, sit behind a robot check, and their terms forbid reproducing or copying the site's content without its written consent, so Romania's trains are placed from their timetables.
- Dutch train positions and formations (Netherlands): OVapi's GTFS-realtime vehiclePositions carry buses, trams and metros but no trains, so the trains are placed from the timetable with InfoPlus's delays. NS's own GPS positions (NStreinposities, every 10 seconds, NS's units only) and every train's units in order (InfoPlus DVS: "VIRM 6", "SLT 4", "FLIRT ARL 2/6" and each NS unit's number) are open (CC0) and keyless, but only as NDOV Loket's best-effort ZeroMQ streams, which a Worker can't subscribe to without a long-lived connection (one per consumer per stream); NS's own API (virtual train, positions) needs a key.
- SNCB's GTFS-realtime (Belgium): given only to those who sign SNCB's licence agreement (asked for through belgiantrain.be's public data form), so SNCB's trains are placed from its timetable and an opened one takes its delays from iRail. Eurostar (Paris, Amsterdam, Köln, London), SNCF's TGVs from Brussels and the Eurocity Direct to Amsterdam aren't in any open timetable for Belgium (SNCB's file has them on scattered days only), so they aren't shown there.
- CFL's live data (Luxembourg): the national HAFAS API's departure boards need a key the Administration des transports publics gives by email, and answer per station, not per train; iRail knows only SNCB's trains there. CFL is placed from its timetable.
- MÁV and GYSEV (Hungary): the live positions on mavplusz.hu work without a key, but MÁV's legal notice forbids storing or republishing the site's content, and its own GTFS needs registration.

## Using it

- **Stations:** every station on these railroads is on the map (intercity stops from regional zoom, commuter stops once you zoom into a metro area). Click one, or search for it, to see which railroads and lines serve it and the next trains due, with live predicted times and delays. Stations shared by several railroads, like New York Penn or Boston South Station, appear as one stop. MBTA stations show the MBTA's own live predictions. Arrivals say where each train is now (its next stop, or the station it's standing at).
- **Near you.** The home list opens with the trains closest to you: press "Find trains near me" and the five nearest (within 100 miles) are listed with how far away each is, whether it's coming your way, its next stop and how late it is, each with a Track button that asks where you're getting off. Your location is asked for only when you press it (and, once allowed, on later visits), stays on your device and is never sent anywhere; the list follows the trains as they move and checks your location again every couple of minutes.
- **Trains later today.** Search also finds trains that haven't left yet: those still to leave today (each railroad's own today) that match the words searched, by number, railroad, line, or first or last station, with when and where each leaves; tap one for its stops and times. From every railroad's timetable (`scripts/build_schedules.py`, rebuilt weekly into `data/schedules/` and indexed in `data/departures.json`); Brightline publishes none, and Tri-Rail's ran out in 2025.
- **Usual tracks.** At the big terminals a track goes up only minutes before a train leaves. The relay notes every track posted at New York Penn, Grand Central, Atlantic Terminal and Jamaica (LIRR), Grand Central (Metro-North), and New York Penn, Hoboken, Newark Penn and Secaucus (NJ Transit), once per train per day. Until a train's real track is posted, its row shows a dashed track: the one it has used on at least 60% of its last ten recorded days (or two tracks between them on 80%), with the count in its tooltip. Amtrak isn't covered, since Amtraker almost never has its platforms. Needs the relay.
- **Disruptions on the map.** Where a railroad says no trains are running right now (service suspended, or buses replacing trains), that stretch of track loses its colored strands for a thin broken line in the railroad's color, labeled ("Buses replace trains") once zoomed in; hover or tap it for the railroad's notice. A station the stretch leaves with no trains of that railroad says so on its page ("No Metro-North trains here right now", with the notice), and its row in Served by reads "No trains right now"; a station at the end that trains still reach from the other side (Southeast, for "between Southeast and Wassaic") doesn't. From the MTA's LIRR and Metro-North alerts and the MBTA's, refreshed every five minutes (`js/disruptions.js`). A stretch runs between the stations the notice names (or lists), trimmed to stations only the affected lines serve, so track other trains still use isn't marked.
- **Tracking.** A train's page has a **Track** button. It asks where you're getting off (the stops ahead, the last one chosen to begin with), then the train stays pinned at the top with a countdown to your stop, and you're told when it gets there. Tap "Tracking to …" to change the stop or stop tracking.
- **Accounts** (where turned on, below): Settings › Sign in, with an email and password or with Google, Facebook and the other providers set up. Signed in, **Your trips** lists the trains you've planned (Upcoming, with "On the map" once that train is running on its day) and the ones you've taken (History, with how many trips, railroads and countries). Add a trip by railroad, train number, day, stations (the railroad's own offered as you type) and times, and "+ Add a connection" for each train after a change (each its own row in `trips`, sharing a `journey` id; run `supabase/schema.sql` again on a project made before connections to add that column); a train you track to your stop is added to History when it gets there, as the trip you'd planned if there was one. Your tracked trains follow you to every device you sign in on. Settings › Your trips › Account deletes the account and everything in it.
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
   - `SWIFTLY_NCTD_KEY`: COASTER and SPRINTER, through Swiftly; request a key at https://www.goswift.ly/realtime-api-key (agency NCTD, granted at NCTD's discretion)
   - `SWIFTLY_DCTA_KEY`: the A-train, through Swiftly; DCTA's "Swiftly API Request Form" at https://www.dcta.net/resources/open-data (the relay assumes Swiftly's agency key `dcta`: check it against the key's email)
   - `TRIMET_APP_ID`: https://developer.trimet.org/appid/registration/ (WES)
   - `TRANSLINK_API_KEY`: https://developer.translink.ca (West Coast Express; 1,000 requests a day, so the relay keeps its answer three minutes)
   - `TFNSW_API_KEY`: https://opendata.transport.nsw.gov.au (an application with the Public Transport realtime APIs; Sydney Trains, NSW TrainLink)
   - `VIC_OPENDATA_KEY`: https://opendata.transport.vic.gov.au (Metro Trains Melbourne, V/Line; sent as the `KeyId` header)
   - `AT_API_KEY`: https://dev-portal.at.govt.nz (subscribe to the Realtime API; AT Metro, Te Huia; 35,000 calls a week, so the relay keeps its answer a minute)
   - `METLINK_API_KEY`: https://opendata.metlink.org.nz (Metlink)
   - `TRAFIKVERKET_API_KEY`: https://data.trafikverket.se (Sweden)
   - `CH_GTFSRT_KEY`: https://api-manager.opentransportdata.swiss (GTFS-RT; Switzerland's delays and cancellations; 2 requests a minute, so the relay keeps its answer a minute)
   - `CH_FORMATION_KEY`: https://api-manager.opentransportdata.swiss (Train Formation Service; an opened train's cars; 50 requests a minute and 20,000 a day, so the relay asks at most 30 a minute and keeps each answer five minutes)

   Every other railroad outside the US and Canada needs none. Until a railroad's key is set, it is placed from its timetable.
4. Put the Worker's URL in `config.js` (`window.TRAINSHEET_RELAY = "https://trainsheet-relay.<you>.workers.dev"`) and push.

The relay only serves the feeds listed in `relay/worker.js` and `relay/feeds/index.js` (it is not an open proxy) and caches each one for 15 seconds, or for the time a plug-in's `RELAY` entry sets (`ttl`, 15 seconds to ten minutes). That copy is kept in the memory of one Worker instance (the edge cache does nothing on workers.dev), so a feed's server sees a few requests per ttl for each instance serving viewers: about one per busy Cloudflare location, sometimes more, however many people each serves. Plug-in feeds send an identifying User-Agent. A Cron Trigger (every five minutes, in `wrangler.toml`) records the tracks posted at the big terminals in the Worker's Durable Object, for usual tracks; it keeps three weeks.

## Turning on accounts

Accounts keep a rider's trips and tracked trains in a [Supabase](https://supabase.com) project (free tier: 50,000 monthly users; a free project pauses after a week with no visits). The site stays static: the page talks to Supabase directly with the project's public key, and row-level security in the database lets each account read and write only its own rows. Until `config.js` names a project, nothing changes: no Sign in, no extra download. Even then, `js/account.js` and Supabase's library (supabase-js, from jsDelivr) load only for someone who opens Sign in or is already signed in.

1. Create a Supabase project. In its SQL editor, run `supabase/schema.sql` (the `trips` and `user_state` tables, their policies, and `delete_my_account()`).
2. **Authentication › URL Configuration:** Site URL `https://0kweather.github.io/trainsheet/`, and add the same under Redirect URLs (plus `http://localhost:8000/` to try it locally). Sign-in links come back to the page's own address.
3. **Email:** Supabase's built-in sender sends only to the project team's own addresses, a few an hour, fine for trying it. For real use, set up custom SMTP (Authentication › Emails; Resend, Postmark or similar) so confirmation and password-reset emails get through.
   The **Reset password** email should carry its code as well as its link, since the link only works in the browser that asked for it (a phone's mail app often opens its own) and the code works anywhere: under Authentication › Emails › Reset password, add a line such as `Or enter this code in Trainsheet: {{ .Token }}`.
4. **Google:** in Google Cloud Console, set up the OAuth consent screen (app name, support email, privacy policy link), then create an OAuth client ID (Web application) with Supabase's callback, `https://<project>.supabase.co/auth/v1/callback`, as its authorized redirect URI. Paste the client ID and secret into Authentication › Providers › Google.
5. **Facebook:** at developers.facebook.com, create an app with Facebook Login, add the same callback under Valid OAuth Redirect URIs, and give it a privacy policy URL and a data deletion instructions URL (riders delete their accounts from Settings) before switching it to Live. Paste its App ID and secret into Providers › Facebook.
6. Others (Apple, GitHub, Microsoft, Discord) work the same way: turn one on in Supabase, then add its name to `providers` in `config.js`. Apple needs a paid Apple Developer account.
7. In `config.js`, set `window.TRAINSHEET_ACCOUNTS` to the project's URL and its **anon** key (Project Settings › API) and push. The anon key is meant to be public; never put the `service_role` key in the site.

Before inviting riders, publish a privacy policy saying what's kept (email, trips, tracked trains) and how to delete it: Google and Facebook both ask for one, and riders in the EU are covered by the GDPR.

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
js/account.js             accounts: signing in, a rider's trips, tracked trains on every device (loaded on demand)
supabase/schema.sql       the accounts' tables and row-level security, run once in the Supabase project
scripts/                  rebuild the data files; local dev relay
scripts/railroads/        one plug-in per railroad outside the built-in set: agencies, feeds, timetable, track
js/railroads/             their parsers (index.js generated by scripts/gen_registry.py)
data/regions/, data/rail/ stations, departures, first trains and track of each country outside the US and Canada
relay/                    Cloudflare Worker for CORS-less and keyed feeds
relay/feeds/              the plug-ins' relay feeds (index.js generated) and their own fetchers
```

Deploys run through `.github/workflows/pages.yml`, which cuts the timetables of railroads placed from them into hourly files (`scripts/slice_schedules.py`, into `data/schedules/now/`, not committed: run it once to try them locally, else the full timetables are used) and stamps every file reference (`?v=dev` in the source) with the commit ID so browsers never mix cached files from different versions.

Refresh the static data occasionally with `python3 scripts/build_static.py`, `python3 scripts/build_stations.py` (`.github/workflows/stations.yml` also rebuilds the stations every Monday afternoon), then `python3 scripts/build_rail.py` (it uses the stations), and `python3 scripts/build_trips.py` (stop and trip lookups for Caltrain, SMART, Metrolink, RTD and CapMetro; it uses the stations too); the workflow runs neither of those two, so run them by hand when a station changes.

Map data © OpenStreetMap contributors, tiles by OpenFreeMap. Train data from the agencies listed above. Rail lines from the USDOT/BTS National Transportation Atlas Database; outside the US and Canada, from OpenStreetMap (© OpenStreetMap contributors, ODbL), built by `scripts/build_rail.py`.

Data outside the US and Canada, credited on the map with each railroad:
- Fintraffic / digitraffic.fi, CC BY 4.0 (Finland).
- Entur, NLOD, the Norwegian Licence for Open Government Data (Norway).
- Renfe (data.renfe.com), CC BY 4.0; FGC Open Data (dadesobertes.fgc.cat), CC BY 4.0 (Spain).
- Iarnród Éireann's realtime API; National Transport Authority / Transport for Ireland timetable, CC BY 4.0 (Ireland).
- Translink (Queensland), CC BY 4.0; Adelaide Metro – Department for Infrastructure and Transport, South Australia, CC BY 3.0 AU; Transport for NSW, CC BY 4.0; Transport Victoria (opendata.transport.vic.gov.au), CC BY 4.0 (Australia).
- Auckland Transport, CC BY 4.0; Metlink (Greater Wellington Regional Council), CC BY 4.0 (New Zealand).
- Trafikverket, CC0; Samtrafiken / Trafiklab GTFS Sweden 3, CC0 1.0, read from the Mobility Database's copy (Sweden).
- opentransportdata.swiss (Open Data Platform Mobility Switzerland): the national timetable (GTFS), GTFS-realtime and the Train Formation Service, under its terms of use (free to process and publish, citing opentransportdata.swiss as the source) (Switzerland).
- SNCB/NMBS timetable via transportdata.be (free of charge, under SNCB's licence agreement); live details from iRail (api.irail.be, SNCB's data published by the iRail non-profit); DB's ICEs from DELFI e.V.'s timetable via gtfs.de, CC BY 4.0 (Belgium).
- Administration des transports publics via data.public.lu, CC BY 4.0 (Luxembourg).
- data.gov.my, CC BY 4.0 (Malaysia).
- OVapi (gtfs.ovapi.nl, Stichting OpenGeo): the national timetable (GTFS) and GTFS-realtime trainUpdates, from NDOV Loket's CC0 data (NS, the regional railways); free to use, best effort (Netherlands).
- ŽSR timetable (data.slovensko.sk), CC BY 1.0; live positions from jbb.ghsq.de (Slovakia).
- Buenos Aires Data timetable, CC BY 2.5 AR; live data from SOFSE / Trenes Argentinos (Argentina).
- Trenitalia and Italo timetables from Italy's National Access Point (cciss.it; published with no licence stated); live details of opened trains from Trenitalia's ViaggiaTreno; Regione Lombardia (Trenord), CC BY 4.0; STA – Südtiroler Transportstrukturen via the Open Data Hub, CC0; EAV, Italian Open Data Licence 2.0; ARST via Sardegna Mobilità, CC BY 4.0; Trentino Trasporti, CC BY 4.0 (Italy).
- CP – Comboios de Portugal timetable (publico.cp.pt, listed on nap-portugal.imt-ip.pt with no licence stated); Fertagus timetable via the National Access Point, free of charge (Portugal).
- Informatica Feroviară's timetables (Mersul Trenurilor de Călători) via data.gov.ro, Open Government Licence Romania 1.0 (OGL-ROU-1.0), and Transitous's GTFS conversion of them (jbb.ghsq.de); station places from OpenStreetMap (Romania).
- BDZ – Пътнически превози's timetable and GTFS-realtime via Bulgaria's National Access Point (sipbg.gov.bg/bgnap; published as open data, no licence stated); stops placed and halts named from OpenStreetMap where the timetable's are off (Bulgaria).
- Elron and the Regionaal- ja Põllumajandusministeerium, timetable CC0 (Estonia).
- Vivi timetable and Pieturas live data (gsvalbe.id.lv), credited as Pieturas asks (Latvia).
- Oběhy (SŽ, CIS JŘ) (Czechia); railway.gov.gr (Greece); Ministry of Transport and Hasadna Open Bus (Israel): no licence published. Railroad logos on the train drawings (`img/logos/`) are the railroads' trademarks, from the public-domain versions on Wikimedia Commons.
