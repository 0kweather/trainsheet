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
# KTMB's timetable places the East Coast line's halts kilometers from where
# they are, some off the track (Sri Mahligai 26 km, Kemubu 9), more along it
# but out of order (Kampung Berkam 18 km down the line), and Seri Setia on
# Setia Jaya. Each is put where OpenStreetMap's station is.
POSITIONS = {
    "84800": [5.99636, 102.14195], "84600": [5.9658, 102.14395], "84400": [5.91762, 102.15632],  # Chicha Tinggi, To Uban, Sungai Keladi
    "81700": [5.47146, 102.22267], "80700": [5.33025, 102.2034], "79800": [5.39033, 102.06428],  # Pahi, Sungai Mengkuang Baru, Kuala Gris
    "78900": [5.30008, 102.02012], "78700": [5.26824, 102.00952], "78500": [5.24834, 102.00964],  # Kemubu, Sri Jaya, Sri Mahligai
    "78400": [5.23068, 102.01027], "78300": [5.21338, 102.01248], "77900": [5.15163, 102.04385],  # Sri Bintang, Sungai Tasin, Bertam
    "76600": [4.96197, 102.0102], "75000": [4.73064, 102.01066], "74500": [4.64553, 101.99396],  # Pan Malayan, Mentara Baru, Teluk Gunung
    "73500": [4.48987, 101.94471], "73100": [4.42203, 101.93168], "72700": [4.35838, 101.92157],  # Sungai Temau, Chegar Perah, Aur Gading
    "72400": [4.29345, 101.92212], "72200": [4.25781, 101.92527], "69600": [4.0753, 102.27157],  # Kampung Berkam, Bukit Betong, Mela
    "53500": [3.08454, 101.6219],  # Seri Setia
}
GTFS = {
    "ktmb": (TIMETABLE, lambda r: r["route_id"] in INTERCITY, lambda r: INTERCITY[r["route_id"]],
             {"number": number, "names": NAMES, "positions": POSITIONS}),
    "ktmkomuter": (TIMETABLE, lambda r: r["route_id"] not in INTERCITY,
                   lambda r: r["route_short_name"],
                   {"number": number, "names": NAMES, "positions": POSITIONS}),
}

# The peninsula's main lines, the East Coast Line and the causeway, as OSM's
# railway=rail main and branch lines in the box (Hat Yai to Woodlands).
RAIL = {"region": "my", "bbox": [100.1, 1.25, 104.0, 7.05], "network": "ktmb"}
