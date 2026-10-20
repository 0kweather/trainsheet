"""NeTEx to GTFS: a railroad's timetable published as NeTEx (the European
Passenger Information profile as Italy's National Access Point carries it,
"NeTEx Livello 1": Trenitalia's and Italo's) turned into a GTFS zip in memory,
so every build script reads it as it reads any other railroad's. feeds.py
converts a GTFS entry's download this way when its extras say "netex"
(True, or a dict of the hooks below); nothing here runs on its own.

What is read, each from wherever the file puts it:
  stops      StopPlace (name, centroid; a quay's or the ScheduledStopPoint's
             position where the place has none), reached from each
             ScheduledStopPoint through its PassengerStopAssignment; a point
             with no assignment is a stop of its own. A stop's id is the last
             part of the place's NeTEx id ("IT::StopPlace:otherTRENITALIA:
             830001700" -> "830001700"), which the publisher keeps from one
             file to the next.
  routes     one per agency and line name the journeys are sorted into (by
             default the journey's operator and its Line's name).
  trips      ServiceJourney: its stops in the order of its journey pattern
             (StopPointInJourneyPattern's "order", not the order the passing
             times come in), TimetabledPassingTime's arrival and departure
             with their day offsets (past 24:00 as GTFS writes them), boarding
             and alighting flags, and the train number (trip_short_name: the
             journey's PublicCode, else its Name, when that is a number).
  calendar   each DayType's dates: a UicOperatingPeriod's ValidDayBits from
             its FromDate, an OperatingPeriod's dates on the DayType's
             DaysOfWeek, a DayTypeAssignment's single Date (isAvailable false
             takes it away). A journey runs on its day types' dates, written
             as calendar_dates.txt, one service per distinct set of dates
             (calendar.txt has only its header).
Left out: service links (the track's shape, most of Trenitalia's file),
interchanges, notices, vehicle types and fares.

Hooks (extras["netex"] as a dict):
  "journey": f(j) -> None (leave it out) or a dict of what to change in it:
             "agency" (an agency id), "route" (the line name), "number".
             j: {"id", "name", "code", "number", "mode", "submode",
             "operator" (its name), "line": {"id", "name", "short", "code",
             "mode"}, "stops": [(stop id, name, (lat, lon) or None), ...]}.
  "stop_name": f(name) -> name, as the file's names should read.
The file may come as XML, gzipped or zipped (each XML file in the zip read
in turn). Standard library only: Trenitalia's runs to 330 MB of XML, read
with iterparse and let go of as it goes."""
import csv, datetime, gzip, io, re, zipfile
import xml.etree.ElementTree as ET

NS = "{http://www.netex.org.uk/netex}"
MODES = {"rail": "2", "bus": "3", "coach": "3", "tram": "0", "metro": "1", "water": "4", "funicular": "7", "cableway": "6"}
DAYS = {"Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6}
DAY_SETS = {"Everyday": range(7), "Weekdays": range(5), "Weekend": (5, 6)}
# The kinds of element read whole as each one ends, then let go of.
ENTITIES = {"Operator", "Authority", "StopPlace", "ScheduledStopPoint", "PassengerStopAssignment", "Line", "FlexibleLine",
            "Route", "ServiceJourneyPattern", "JourneyPattern", "DayType", "UicOperatingPeriod", "OperatingPeriod",
            "DayTypeAssignment", "ServiceJourney", "ServiceLink", "Notice", "NoticeAssignment"}


def tag(el):
    return el.tag.rsplit("}", 1)[-1]


def text(el, path):
    """The text at a path of local names ("Centroid/Location/Latitude")."""
    found = el.find("/".join(NS + p for p in path.split("/"))) if el is not None else None
    return (found.text or "").strip() if found is not None and found.text else ""


def ref(el, path):
    found = el.find("/".join(NS + p for p in path.split("/")))
    return found.get("ref") if found is not None else None


def short_id(netex_id):
    """"IT::StopPlace:otherTRENITALIA:830001700" -> "830001700"; Italo pads
    its codes ("IT::StopPlace:PD-") -> "PD"."""
    return netex_id.rsplit(":", 1)[-1].rstrip("-") or netex_id


def position(el):
    lat, lon = text(el, "Centroid/Location/Latitude"), text(el, "Centroid/Location/Longitude")
    if not lat:
        lat, lon = text(el, "Location/Latitude"), text(el, "Location/Longitude")
    return (float(lat), float(lon)) if lat and lon else None


def day(value):
    return datetime.date.fromisoformat(value[:10])


class Reader:
    """Everything the conversion needs from one or more NeTEx files."""

    def __init__(self):
        self.operators, self.places, self.points, self.assigned = {}, {}, {}, {}
        self.lines, self.routes, self.patterns = {}, {}, {}
        self.day_types, self.periods, self.assignments = {}, {}, {}
        self.journeys, self.tz, self.skipped = [], None, {}

    def read(self, f):
        for event, el in ET.iterparse(f, events=("end",)):
            name = tag(el)
            if name == "TimeZone" and not self.tz:
                self.tz = (el.text or "").strip() or None
            if name not in ENTITIES:
                continue
            # A Line inside a journey's FlexibleLineView, an operator inside
            # a line, and so on, are refs (no id of their own): not entities.
            if el.get("id"):
                getattr(self, "on_" + name, self.skip)(el, name)
                el.clear()

    def skip(self, el, name):
        self.skipped[name] = self.skipped.get(name, 0) + 1

    def on_Operator(self, el, _):
        self.operators[el.get("id")] = text(el, "Name") or text(el, "LegalName") or el.get("id")
    on_Authority = on_Operator

    def on_StopPlace(self, el, _):
        quays = el.findall(f"{NS}quays/{NS}Quay")
        at = position(el) or next((p for p in map(position, quays) if p), None)
        place = {"id": short_id(el.get("id")), "name": text(el, "Name"), "at": at}
        self.places[el.get("id")] = place
        for q in quays:  # a journey that names a quay stops at its place
            self.places[q.get("id")] = place

    def on_ScheduledStopPoint(self, el, _):
        self.points[el.get("id")] = {"id": short_id(el.get("id")), "name": text(el, "Name"), "at": position(el)}

    def on_PassengerStopAssignment(self, el, _):
        point = ref(el, "ScheduledStopPointRef")
        if point:
            self.assigned[point] = ref(el, "StopPlaceRef") or ref(el, "QuayRef")

    def on_Line(self, el, _):
        self.lines[el.get("id")] = {"id": el.get("id"), "name": text(el, "Name"), "short": text(el, "ShortName"),
                                    "code": text(el, "PublicCode"), "mode": text(el, "TransportMode"),
                                    "operator": ref(el, "OperatorRef")}
    on_FlexibleLine = on_Line

    def on_Route(self, el, _):
        self.routes[el.get("id")] = ref(el, "LineRef")

    def on_ServiceJourneyPattern(self, el, _):
        points = {}
        for p in el.iter(NS + "StopPointInJourneyPattern"):
            points[p.get("id")] = (int(p.get("order") or len(points) + 1), ref(p, "ScheduledStopPointRef"),
                                   text(p, "ForBoarding") != "false", text(p, "ForAlighting") != "false")
        self.patterns[el.get("id")] = {"line": ref(el, "RouteView/LineRef") or ref(el, "LineRef"),
                                       "route": ref(el, "RouteRef"), "points": points}
    on_JourneyPattern = on_ServiceJourneyPattern

    def on_DayType(self, el, _):
        days = set()
        for word in " ".join(t.text or "" for t in el.iter(NS + "DaysOfWeek")).split():
            days.update(DAY_SETS.get(word, [DAYS[word]] if word in DAYS else []))
        self.day_types[el.get("id")] = days or set(range(7))

    def on_UicOperatingPeriod(self, el, _):
        start, bits = day(text(el, "FromDate")), text(el, "ValidDayBits")
        self.periods[el.get("id")] = {start + datetime.timedelta(i) for i, b in enumerate(bits) if b == "1"}

    def on_OperatingPeriod(self, el, _):
        start, end = day(text(el, "FromDate")), day(text(el, "ToDate"))
        self.periods[el.get("id")] = ("range", start, end)

    def on_DayTypeAssignment(self, el, _):
        day_type = ref(el, "DayTypeRef")
        if day_type:
            self.assignments.setdefault(day_type, []).append(
                (ref(el, "OperatingPeriodRef"), text(el, "Date"), text(el, "isAvailable") != "false"))

    def on_ServiceJourney(self, el, _):
        times = []
        for t in el.iter(NS + "TimetabledPassingTime"):
            times.append((ref(t, "StopPointInJourneyPatternRef"), text(t, "ArrivalTime"), text(t, "ArrivalDayOffset"),
                          text(t, "DepartureTime"), text(t, "DepartureDayOffset")))
        self.journeys.append({"id": el.get("id"), "name": text(el, "Name"), "code": text(el, "PublicCode"),
                              "private": text(el, "PrivateCode"), "mode": text(el, "TransportMode"),
                              "submode": next((s.text.strip() for s in el.iter() if tag(s).endswith("Submode") and s.text), ""),
                              "day_types": [d.get("ref") for d in el.iter(NS + "DayTypeRef")],
                              "pattern": ref(el, "ServiceJourneyPatternRef") or ref(el, "JourneyPatternRef"),
                              "line": ref(el, "LineRef") or ref(el, "FlexibleLineView/LineRef"),
                              "operator": ref(el, "OperatorRef"), "times": times})

    def on_ServiceLink(self, el, _):  # the track's shape: not needed
        pass

    def dates(self, day_type):
        """The dates a DayType runs on."""
        out, removed = set(), set()
        for period, date, available in self.assignments.get(day_type, []):
            if date:
                (out if available else removed).add(day(date))
            elif period in self.periods:
                p = self.periods[period]
                if isinstance(p, tuple):
                    weekdays = self.day_types.get(day_type, set(range(7)))
                    p = {p[1] + datetime.timedelta(i) for i in range((p[2] - p[1]).days + 1)
                         if (p[1] + datetime.timedelta(i)).weekday() in weekdays}
                (out if available else removed).update(p)
        return out - removed

    def stop(self, point_id):
        """A ScheduledStopPoint's stop: its assigned place, else itself."""
        place = self.places.get(self.assigned.get(point_id))
        point = self.points.get(point_id) or {"id": short_id(point_id), "name": "", "at": None}
        if not place:
            return point
        return {**place, "at": place["at"] or point["at"], "name": place["name"] or point["name"]}


def clock(hms, offset):
    """"23:55:00", "1" -> "47:55:00"."""
    if not hms:
        return ""
    h, m, s = (hms.split(":") + ["0", "0"])[:3]
    return f"{int(h) + 24 * int(offset or 0):02d}:{int(m):02d}:{int(float(s)):02d}"


def files(data):
    """The XML documents in a download: itself, unpacked, or each in a zip."""
    if data[:2] == b"\x1f\x8b":
        yield gzip.GzipFile(fileobj=io.BytesIO(data))
    elif data[:2] == b"PK":
        zf = zipfile.ZipFile(io.BytesIO(data))
        for name in sorted(n for n in zf.namelist() if n.lower().endswith(".xml")):
            yield zf.open(name)
    else:
        yield io.BytesIO(data)


def number_of(j):
    return next((v for v in (j["code"], j["name"], j["private"]) if v and v.isdigit()), "")


def to_gtfs(data, hooks=None, log=print):
    """The GTFS zip (bytes) for a NeTEx download."""
    hooks = hooks if isinstance(hooks, dict) else {}
    r = Reader()
    for f in files(data):
        r.read(f)
    stop_name = hooks.get("stop_name") or (lambda n: n)
    journey_hook = hooks.get("journey")
    stops, routes, trips, stop_times, services, agencies = {}, {}, [], [], {}, {}
    dropped, unplaced = 0, 0
    for j in r.journeys:
        pattern = r.patterns.get(j["pattern"]) or {"points": {}, "line": None, "route": None}
        line = r.lines.get(j["line"] or pattern["line"] or r.routes.get(pattern["route"])) or {}
        visits = []
        for point_ref, arr, arr_off, dep, dep_off in j["times"]:
            order, point, board, alight = pattern["points"].get(point_ref, (None, None, True, True))
            if point is None:
                unplaced += 1
                continue
            visits.append((order, r.stop(point), clock(arr, arr_off), clock(dep, dep_off), board, alight))
        visits.sort(key=lambda v: v[0])
        if len(visits) < 2:
            dropped += 1
            continue
        operator = r.operators.get(j["operator"] or line.get("operator"), "")
        info = {"id": j["id"], "name": j["name"], "code": j["code"], "number": number_of(j),
                "mode": j["mode"] or line.get("mode", ""), "submode": j["submode"], "operator": operator,
                "line": line, "stops": [(v[1]["id"], v[1]["name"], v[1]["at"]) for v in visits]}
        change = journey_hook(info) if journey_hook else {}
        if change is None:
            dropped += 1
            continue
        agency = change.get("agency") or re.sub(r"[^a-z0-9]+", "", operator.lower()) or "netex"
        route = change.get("route") or line.get("name") or line.get("code") or line.get("short") or info["mode"]
        dates = set()
        for d in j["day_types"]:
            dates |= r.dates(d)
        if not dates:
            dropped += 1
            continue
        service = services.setdefault(frozenset(dates), f"s{len(services) + 1}")
        agencies.setdefault(agency, operator or agency)
        route_id = f"{agency}:{route}"
        routes.setdefault(route_id, {"route_id": route_id, "agency_id": agency, "route_short_name": route,
                                     "route_long_name": route, "route_type": MODES.get(info["mode"], "2")})
        trip_id = short_id(j["id"])
        trips.append({"route_id": route_id, "service_id": service, "trip_id": trip_id,
                      "trip_short_name": change.get("number", info["number"]),
                      "trip_headsign": stop_name(visits[-1][1]["name"])})
        for seq, (_, s, arr, dep, board, alight) in enumerate(visits, 1):
            stops.setdefault(s["id"], s)
            stop_times.append({"trip_id": trip_id, "arrival_time": arr or dep, "departure_time": dep or arr,
                               "stop_id": s["id"], "stop_sequence": seq, "pickup_type": "" if board else "1",
                               "drop_off_type": "" if alight else "1"})
    tz = hooks.get("tz") or r.tz or "UTC"
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as zf:
        def write(name, fields, rows_):
            buf = io.StringIO()
            w = csv.DictWriter(buf, fields, lineterminator="\n")
            w.writeheader()
            w.writerows(rows_)
            zf.writestr(name, buf.getvalue())
        write("agency.txt", ["agency_id", "agency_name", "agency_url", "agency_timezone"],
              [{"agency_id": a, "agency_name": n, "agency_url": "", "agency_timezone": tz} for a, n in agencies.items()])
        write("stops.txt", ["stop_id", "stop_name", "stop_lat", "stop_lon", "location_type"],
              [{"stop_id": s["id"], "stop_name": stop_name(s["name"]), "stop_lat": f"{s['at'][0]:.6f}" if s["at"] else "",
                "stop_lon": f"{s['at'][1]:.6f}" if s["at"] else "", "location_type": "0"} for s in stops.values()])
        write("routes.txt", ["route_id", "agency_id", "route_short_name", "route_long_name", "route_type"], routes.values())
        write("trips.txt", ["route_id", "service_id", "trip_id", "trip_short_name", "trip_headsign"], trips)
        write("stop_times.txt", ["trip_id", "arrival_time", "departure_time", "stop_id", "stop_sequence", "pickup_type",
                                 "drop_off_type"], stop_times)
        write("calendar.txt", ["service_id", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
                               "start_date", "end_date"], [])
        write("calendar_dates.txt", ["service_id", "date", "exception_type"],
              ({"service_id": sid, "date": d.strftime("%Y%m%d"), "exception_type": "1"}
               for dates, sid in services.items() for d in sorted(dates)))
    skipped = ", ".join(f"{n} {k}" for k, n in sorted(r.skipped.items()))
    log(f"  NeTEx: {len(r.journeys)} journeys, {len(trips)} kept ({dropped} left out), {len(stops)} stops, "
        f"{len(services)} calendars{'; ' + str(unplaced) + ' passing times off their pattern' if unplaced else ''}"
        f"{'; not read: ' + skipped if skipped else ''}")
    return out.getvalue()
