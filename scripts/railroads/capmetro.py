"""CapMetro Rail: plug-in."""

# The Red Line is route 550 of CapMetro's whole network.
GTFS = {
    "capmetro": ("https://files.mobilitydatabase.org/mdb-150/latest.zip", lambda r: r["route_id"] == "550", lambda r: "Red Line"),
}
