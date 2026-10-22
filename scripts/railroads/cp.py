"""CP – Comboios de Portugal: its long-distance trains (Alfa Pendular and
Intercidades), its regional trains (InterRegional, Regional and Coimbra's
urbanos) and the urbanos of Lisbon and Porto, from CP's national timetable
(GTFS, publico.cp.pt, no key; listed on Portugal's National Access Point,
nap-portugal.imt-ip.pt, which gives it no licence). CP publishes no live feed
open to all (its site's live times come from an API of its own, for its own
pages), so the trains are placed from that timetable (a "timetable" source,
no parser file), marked estimated, as Italy's are."""
import re

GTFS_URL = "https://publico.cp.pt/gtfs/gtfs.zip"
CREDIT = {"label": "CP – Comboios de Portugal via the National Access Point", "href": "https://nap-portugal.imt-ip.pt"}
BBOX = [-9.5, 36.95, -6.75, 42.1]
COMMON = {"country": "PT", "tz": "Europe/Lisbon", "credit": CREDIT, "license": None, "clip": True, "cars": True}

AGENCIES = {
    "cplc": {"name": "CP Longo Curso", "short": "CP Longo Curso", "region": "Portugal", "color": "#00573f",
             "kind": "intercity", "bbox": BBOX, **COMMON},
    "cpreg": {"name": "CP Regional", "short": "CP Regional", "region": "Portugal", "color": "#5a8f29",
              "kind": "commuter", "after": "cplc", "bbox": BBOX, **COMMON},
    "cplisboa": {"name": "CP Urbanos de Lisboa", "short": "CP Lisboa", "region": "Lisbon", "color": "#00573f",
                 "kind": "commuter", "after": "cpreg", "bbox": [-9.45, 38.45, -8.75, 39.1], **COMMON},
    "cpporto": {"name": "CP Urbanos do Porto", "short": "CP Porto", "region": "Porto", "color": "#00573f",
                "kind": "commuter", "after": "cplisboa", "bbox": [-8.75, 40.6, -8.0, 41.6], **COMMON},
}
SOURCES = [{"id": "cp", "agencies": list(AGENCIES), "format": "timetable", "interval": 60, "scope": "view"}]

# The file's routes by their short names: the long-distance and regional
# trains by category, the urbanos by line ("Linha de Sintra").
CATEGORIES = {"AP": ("cplc", "Alfa Pendular"), "IC": ("cplc", "Intercidades"), "IR": ("cpreg", "InterRegional"),
              "R": ("cpreg", "Regional")}
# "U" files three sets of urbanos together, told apart by the stops the route
# id names (its "25-94_36004-94_64113" runs Coimbra-B to Figueira da Foz):
# Coimbra's, the Cascais line's short runs to São Pedro do Estoril and
# Porto's to Braga.
U_ENDS = {"94_36004": ("cpreg", "Urbanos de Coimbra"), "94_69005": ("cplisboa", "Linha de Cascais"),
          "94_2006": ("cpporto", "Linha de Braga")}


def category(r):
    """(railroad, line) of a route row."""
    short = name(r["route_short_name"])
    if short == "U":
        return next((U_ENDS[s] for s in r["route_id"].split("-")[1:] if s in U_ENDS), (None, None))
    if short in CATEGORIES:
        return CATEGORIES[short]
    return ("cplisboa" if short in LISBOA else "cpporto" if short in PORTO else None), short
LISBOA = {"Linha de Sintra", "Linha de Cascais", "Linha da Azambuja", "Linha do Sado"}
PORTO = {"Linha de Braga", "Linha de Guimarães", "Linha de Aveiro", "Linha do Marco", "Linha de Leixões"}

# CP files its names without their accents ("Porto Campanha", "Linha de
# Leixoes"): as CP signs them, the accents from OpenStreetMap's names for the
# same stations.
NAMES = {
    "Ademia": "Adémia", "Agualva - Cacem": "Agualva - Cacém",
    "Aguas Santas - Palmilheira": "Águas Santas - Palmilheira", "Agueda": "Águeda", "Alcacovas": "Alcáçovas",
    "Alcantara - Mar": "Alcântara - Mar", "Alcantara - Terra": "Alcântara - Terra", "Alges": "Algés",
    "Algueirao - Mem Martins": "Algueirão - Mem Martins", "Alvaraes": "Alvarães", "Ancora-Praia": "Âncora-Praia",
    "Baracal": "Baraçal", "Belem": "Belém", "Benquerencas": "Benquerenças",
    "Bifurcacao de Lares": "Bifurcação de Lares", "Bom Joao": "Bom João", "Braco de Prata": "Braço de Prata",
    "Cabanoes": "Cabanões", "Caide": "Caíde", "Cais do Sodre": "Cais do Sodré", "Canicos": "Caniços",
    "Carapecos": "Carapeços", "Carreco": "Carreço", "Casal do Alvaro": "Casal do Álvaro", "Cete": "Cête",
    "Chanca": "Chança", "Chao de Macas - Fatima": "Chão de Maçãs - Fátima", "Coimbroes": "Coimbrões",
    "Conceicao": "Conceição", "Cortegaca": "Cortegaça", "Couto de Cucujaes": "Couto de Cucujães",
    "Covilha": "Covilhã", "Durraes": "Durrães", "Escapaes": "Escapães", "Estombar - Lagoa": "Estômbar - Lagoa",
    "Famalicao": "Famalicão", "Famalicao da Nazare": "Famalicão da Nazaré", "Fernando Po": "Fernando Pó",
    "Ferrao": "Ferrão", "Formoselha - Santo Varao": "Formoselha - Santo Varão",
    "Freixo de Numao - Mos do Douro": "Freixo de Numão - Mós do Douro", "Fundao": "Fundão", "Gondarem": "Gondarém",
    "Grandola": "Grândola", "Guimaraes": "Guimarães", "Hospital Sao Joao": "Hospital São João",
    "Leca do Balio": "Leça do Balio", "Lisboa Santa Apolonia": "Lisboa Santa Apolónia", "Livracao": "Livração",
    "Loule": "Loulé", "Lourical": "Louriçal", "Luso - Bucaco": "Luso - Buçaco", "Macainhas": "Maçainhas",
    "Martinganca - Maceira": "Martingança - Maceira", "Massama - Barcarena": "Massamá - Barcarena",
    "Mazagao": "Mazagão", "Merces": "Mercês", "Midoes": "Midões", "Mira Sintra - Melecas": "Mira Sintra - Meleças",
    "Mirao": "Mirão", "Monte Abraao": "Monte Abraão", "Mortagua": "Mortágua", "Obidos": "Óbidos", "Oia": "Oiã",
    "Olhao": "Olhão", "Oliveira de Azemeis": "Oliveira de Azeméis", "Paco de Arcos": "Paço de Arcos",
    "Pacos de Brandao": "Paços de Brandão", "Papizios": "Papízios", "Pegoes": "Pegões", "Pinhao": "Pinhão",
    "Poceirao": "Poceirão", "Poco Barreto": "Poço Barreto", "Portimao": "Portimão",
    "Porto Campanha": "Porto Campanhã", "Porto Sao Bento": "Porto São Bento", "Praca do Quebedo": "Praça do Quebedo",
    "Regua": "Régua", "Riachos - Torres Novas - Golega": "Riachos - Torres Novas - Golegã", "Rio Meao": "Rio Meão",
    "Santa Clara - Saboia": "Santa Clara - Sabóia", "Santa Comba Dao": "Santa Comba Dão",
    "Santa Eulalia-A": "Santa Eulália-A", "Sao Frutuoso": "São Frutuoso", "Sao Gemil": "São Gemil",
    "Sao Joao Loure": "São João de Loure", "Sao Joao da Madeira": "São João da Madeira",
    "Sao Joao das Craveiras": "São João das Craveiras", "Sao Joao de Ver": "São João de Ver",
    "Sao Joao do Estoril": "São João do Estoril", "Sao Mamede de Infesta": "São Mamede de Infesta",
    "Sao Martinho do Campo": "São Martinho do Campo", "Sao Martinho do Porto": "São Martinho do Porto",
    "Sao Pedro da Torre": "São Pedro da Torre", "Sao Pedro do Estoril": "São Pedro do Estoril",
    "Sao Romao": "São Romão", "Seica - Ourem": "Seiça - Ourém", "Simoes": "Simões", "Suzao": "Suzão",
    "Travasso": "Travassô", "Vacarica": "Vacariça", "Valado - Nazare - Alcobaca": "Valado - Nazaré - Alcobaça",
    "Vale de Santarem": "Vale de Santarém", "Valega": "Válega", "Valenca": "Valença", "Vesuvio": "Vesúvio",
    "Vila Mea": "Vila Meã", "Vila Nova de Ancos": "Vila Nova de Anços",
    "Vila Real de Santo Antonio": "Vila Real de Santo António", "Vila Velha de Rodao": "Vila Velha de Ródão",
    "Linha de Guimaraes": "Linha de Guimarães", "Linha de Leixoes": "Linha de Leixões",
}


def name(s):
    """A stop's or a headsign's name as signed: one space around a dash and
    between words ("Alcantara -  Mar" is Alcântara - Mar), accents put back."""
    s = re.sub(r"\s+", " ", re.sub(r"\s+-\s+", " - ", s)).strip()
    return NAMES.get(s, s)


def line(r):
    return category(r)[1]


def agency_of(r):
    return category(r)[0]


COLORS = {"Alfa Pendular": "#00573f", "Intercidades": "#00573f", "InterRegional": "#5a8f29", "Regional": "#5a8f29",
          "Urbanos de Coimbra": "#5a8f29", "Linha de Sintra": "#00573f", "Linha de Cascais": "#00573f",
          "Linha da Azambuja": "#00573f", "Linha do Sado": "#00573f", "Linha de Braga": "#00573f",
          "Linha de Guimarães": "#00573f", "Linha de Aveiro": "#00573f", "Linha do Marco": "#00573f",
          "Linha de Leixões": "#00573f"}
LINES = {"cplc": {"Alfa Pendular", "Intercidades"}, "cpreg": {"InterRegional", "Regional", "Urbanos de Coimbra"},
         "cplisboa": LISBOA, "cpporto": PORTO}
GTFS = {agency: (GTFS_URL, lambda r, a=agency: agency_of(r) == a, line,
                 {"number": lambda t: t.get("trip_short_name") or None, "tz": "Europe/Lisbon", "rename": name,
                  "colors": {l: COLORS[l] for l in LINES[agency]}})
        for agency in AGENCIES}

# Portugal's track is built apart, from Geofabrik's extract.
RAIL = {"region": "pt", "bbox": BBOX, "network": "cpreg"}
