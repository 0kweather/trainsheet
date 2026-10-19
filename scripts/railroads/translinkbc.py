"""West Coast Express (Vancouver-Mission): TransLink's GTFS-realtime
positions and trip updates, through the relay, with the free API key
TransLink issues at https://developer.translink.ca (the Worker secret
TRANSLINK_API_KEY); until it is set the trains are placed from the
timetable. Both feeds cover TransLink's whole network, so the relay passes on
only the West Coast Express's entities (route 6770).

TransLink says its West Coast Express times are scheduled, not real-time,
and people who have read the live feeds report buses alone in them: the
parser (js/railroads/translinkbc.js) uses any West Coast Express train the
feed does carry, and places the rest from the timetable. TransLink
publishes no train numbers (the press's "train No. 3" is the third departure
of the direction), so the runs go unnumbered."""

# TransLink's terms ask that this disclaimer be shown wherever its data is.
DISCLAIMER = ("Some of the data used in this product or service is provided by permission of TransLink. "
              "TransLink assumes no responsibility for the accuracy or currency of the Data used in this product or service.")
AGENCIES = {
    "westcoastexpress": {"name": "West Coast Express", "short": "WCE", "region": "Vancouver", "country": "CA", "color": "#3e4199",
                         "kind": "commuter", "tz": "America/Vancouver",
                         "credit": {"label": "TransLink", "href": "https://www.translink.ca/about-us/doing-business-with-translink/app-developer-resources"},
                         "license": DISCLAIMER, "bbox": [-123.13, 49.11, -122.28, 49.30], "after": "exo", "cars": True},
}
# A TransLink key allows 1,000 requests a day. Each refresh is two (positions
# and trip updates), so a 180 s ttl keeps even a whole day of watching to 960;
# the trains run only on weekday mornings and evenings, and the feed is
# fetched only while someone has them on screen.
SOURCES = [{"id": "translinkbc", "agencies": ["westcoastexpress"], "format": "pb", "interval": 60, "relay": True,
            "needsKey": "TRANSLINK_API_KEY", "untilKey": "timetable", "scope": "view", "after": "exo"}]
RELAY = {"translinkbc": {"url": "https://gtfsapi.translink.ca/v3/gtfsposition?apikey={TRANSLINK_API_KEY}",
                         "also": ["https://gtfsapi.translink.ca/v3/gtfsrealtime?apikey={TRANSLINK_API_KEY}"],
                         "keys": ["TRANSLINK_API_KEY"], "routes": ["6770"], "ua": True, "ttl": 180}}

# TransLink's whole timetable: the West Coast Express is route "WCE" (route
# id 6770, the one the relay keeps). Its stations are filed per direction
# ("Port Haney Station Westbound", "Mission City Station Unload Only"), and
# each trip also lists a stop "@ West Coast Express" a second after some
# stations, with no parent station: all fold into one station per name
# ("Port Haney"). "trips": stop and trip lookups for the live feeds.
GTFS = {
    "westcoastexpress": ("https://gtfs-static.translink.ca/gtfs/google_transit.zip", lambda r: r.get("route_short_name") == "WCE",
                         lambda r: "West Coast Express",
                         {"fold": {"strip": r"\s+Station(\s+(Eastbound|Westbound|Unload Only)|\s+@ West Coast Express)?$"},
                          "trips": ["6770"], "colors": {"West Coast Express": "#3e4199"}}),
}
