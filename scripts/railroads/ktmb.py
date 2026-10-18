"""KTMB (Keretapi Tanah Melayu, Malaysia and the Shuttle Tebrau to
Singapore): the GTFS-realtime positions data.gov.my publishes, fetched by the
browser directly (the API sends CORS headers and needs no key). The feed
names each train by its trip id, which is its number in KTMB's timetable
("9442", or "2203" for Komuter's "weekday_2203"), and gives no stop times, so
a train's stops come from the timetable (data/schedules/<agency>.json). The
intercity trains (ETS, Intercity, Shuttle Tebrau) and KTM Komuter are two
railroads here, as they're signed; one parser, js/railroads/ktmb.js, sorts
the feed's trains between them by their numbers."""

AGENCIES = {
    "ktmb": {"name": "KTMB", "short": "KTMB", "region": "Malaysia", "country": "MY", "color": "#ffc72c",
             "kind": "intercity", "tz": "Asia/Kuala_Lumpur",
             "credit": {"label": "data.gov.my", "href": "https://developer.data.gov.my/realtime-api/gtfs-realtime"},
             "license": "CC BY 4.0", "bbox": [100.1, 1.25, 104.0, 7.05], "cars": True},
    "ktmkomuter": {"name": "KTM Komuter", "short": "Komuter", "region": "Malaysia", "country": "MY", "color": "#3c5a9f",
                   "kind": "commuter", "tz": "Asia/Kuala_Lumpur",
                   "credit": {"label": "data.gov.my", "href": "https://developer.data.gov.my/realtime-api/gtfs-realtime"},
                   "license": "CC BY 4.0", "bbox": [100.2, 1.45, 103.8, 6.7], "after": "ktmb", "cars": True},
}
# The API allows 4 requests a minute from each address (more get a 429) and
# refreshes the feed every 30 seconds, but each train's position in it moves
# only every minute or two. So each viewer polls it once a minute, and only
# while Malaysia is in view, which leaves room for a second tab or a reload.
# Each viewer fetches it from their own address: a shared relay would put
# every viewer's polls on one address's 4 a minute. (The address without the
# final slash answers with a redirect to this one.)
SOURCES = [{"id": "ktmb", "agencies": ["ktmb", "ktmkomuter"], "format": "pb", "interval": 60, "relay": False,
            "url": "https://api.data.gov.my/gtfs-realtime/vehicle-position/ktmb/", "needsKey": False, "scope": "view"}]

# The timetable is rebuilt daily at 00:01. The API's address for it
# (https://api.data.gov.my/gtfs-static/ktmb/) redirects here, and counts
# against the same 4 requests a minute, which a build reading it once per
# railroad per script runs into; the file itself has no limit.
TIMETABLE = "https://openapi-malaysia-transport.s3.ap-southeast-1.amazonaws.com/ktmb/gtfs_ktmb.zip"
# Komuter's routes are filed as trams (route_type 0), the intercity ones as rail.
INTERCITY = {"ETS": "ETS", "SH": "Intercity Shuttle", "ERT": "Ekspres Rakyat Timuran", "ST": "Shuttle Tebrau"}
# Komuter's trip ids carry the service ("weekday_2203"); the train is 2203.
number = lambda t: t["trip_id"].rsplit("_", 1)[-1] or None
NAMES = {"Kl Sentral": "KL Sentral", "Jb Sentral": "JB Sentral", "Ukm": "UKM", "Woodlands Ciq": "Woodlands CIQ",
         "Bdr Tasek Selatan": "Bandar Tasek Selatan", "Pel Klang Sel": "Pelabuhan Klang Selatan", "Jln Kastam": "Jalan Kastam",
         "Kg. Sirian": "Kampung Sirian", "Kg Dato Harun": "Kampung Dato Harun", "Kg Raja Uda": "Kampung Raja Uda",
         "Kg Berkam": "Kampung Berkam", "Kg Kok Pasir": "Kampung Kok Pasir", "Kg Baru Bukit Abu": "Kampung Baru Bukit Abu",
         "Sg Mengkuang Baru": "Sungai Mengkuang Baru",
         "Perhentian Midvalley": "Mid Valley", "Batu Kentomenn": "Batu Kentonmen"}
GTFS = {
    "ktmb": (TIMETABLE, lambda r: r["route_id"] in INTERCITY, lambda r: INTERCITY[r["route_id"]],
             {"number": number, "names": NAMES}),
    "ktmkomuter": (TIMETABLE, lambda r: r["route_id"] not in INTERCITY,
                   lambda r: r["route_short_name"],
                   {"number": number, "names": NAMES}),
}

# The peninsula's main lines, the East Coast Line and the causeway, as OSM's
# railway=rail main and branch lines in the box (Hat Yai to Woodlands).
RAIL = {"region": "my", "bbox": [100.1, 1.25, 104.0, 7.05], "network": "ktmb"}
