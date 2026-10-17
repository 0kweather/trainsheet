"""Tri-Rail: plug-in."""

# The Mobility Database's copy of Tri-Rail's timetable ran out in August 2025;
# Tri-Rail's own (https://gtfs.tri-rail.com/gtfs.zip) is said to be current,
# not switched to yet. Rail routes only: not the airport shuttle's stops. No
# timetable file until there's a current one.
GTFS = {
    "trirail": ("https://files.mobilitydatabase.org/mdb-333/latest.zip", lambda r: r.get("route_type") == "2", lambda r: "Tri-Rail",
                {"schedule": False}),
}
