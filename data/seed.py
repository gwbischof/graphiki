"""
Seed data for the Epstein network graph.
All entries sourced from DOJ EFTA documents.
"""

DOJ_BASE = "https://www.justice.gov/epstein/files"


def doc_url(doc_id: str, dataset: int = 9) -> str:
    return f"{DOJ_BASE}/DataSet%20{dataset}/{doc_id}.pdf"


# ---------------------------------------------------------------------------
# PERSONS
# ---------------------------------------------------------------------------
PERSONS = [
    # --- Core co-conspirators (Tier 1) ---
    {
        "id": "jeffrey_epstein",
        "name": "Jeffrey Epstein",
        "role": "principal",
        "network": "epstein",
        "doc_count": 500000,
        "status": "deceased",
        "section": 1,
        "notes": "Died August 10, 2019 in MCC New York. Convicted 2008 FL, arrested 2019 SDNY.",
    },
    {
        "id": "ghislaine_maxwell",
        "name": "Ghislaine Maxwell",
        "role": "co-conspirator",
        "network": "epstein",
        "doc_count": 25000,
        "status": "convicted",
        "section": 1,
        "notes": "SITREP #4. Convicted Dec 2021, 5 of 6 counts incl. sex trafficking of a minor. 20 years.",
    },
    {
        "id": "jean_luc_brunel",
        "name": "Jean-Luc Brunel",
        "role": "co-conspirator",
        "network": "epstein",
        "doc_count": 5000,
        "status": "deceased",
        "section": 1,
        "notes": "SITREP #6. Founded MC2 with Epstein funding. Died Feb 19, 2022 in Paris prison.",
    },
    {
        "id": "daniel_siad",
        "name": "Daniel Siad",
        "role": "recruiter",
        "network": "epstein",
        "doc_count": 2500,
        "status": "not-charged",
        "section": 4,
        "notes": "Tier 1 #3. Active recruiter 2013-2019. FBI subject #13. 'I have girls staying with me.'",
    },
    {
        "id": "sarah_kellen",
        "name": "Sarah Kellen",
        "role": "co-conspirator",
        "network": "epstein",
        "doc_count": 8000,
        "status": "not-charged",
        "section": 1,
        "notes": "SITREP #1. NPA immunity. Scheduled abuse sessions.",
    },
    {
        "id": "nadia_marcinkova",
        "name": "Nadia Marcinkova",
        "role": "co-conspirator",
        "network": "epstein",
        "doc_count": 4000,
        "status": "not-charged",
        "section": 1,
        "notes": "SITREP #5. NPA immunity. Dual victim/co-conspirator status.",
    },
    {
        "id": "adriana_ross",
        "name": "Adriana Ross",
        "role": "co-conspirator",
        "network": "epstein",
        "doc_count": 3000,
        "status": "not-charged",
        "section": 1,
        "notes": "SITREP #2. Invoked 5th Amendment 100+ times. Removed computer drives during search warrant.",
    },
    {
        "id": "lesley_groff",
        "name": "Lesley Groff",
        "role": "co-conspirator",
        "network": "epstein",
        "doc_count": 12000,
        "status": "not-charged",
        "section": 1,
        "notes": "SITREP #3. Executive assistant. Coordinated limo pickups of young women. 'Remain loyal to JE.'",
    },
    {
        "id": "tony_figueroa",
        "name": "Tony Figueroa",
        "role": "recruiter",
        "network": "epstein",
        "doc_count": 500,
        "status": "not-charged",
        "section": 4,
        "notes": "Tier 1 #5. '$200 apiece for every one we brought over.' Recruited from local high schools.",
    },

    # --- Tier 2: Facilitation with knowledge ---
    {
        "id": "leslie_wexner",
        "name": "Leslie Wexner",
        "role": "financier",
        "network": "epstein",
        "doc_count": 3500,
        "status": "under-investigation",
        "section": 1,
        "notes": "SITREP #8. 'Gang stuff for over 15 years.' Transferred $46M+ to Epstein. Deposition Feb 18 2026.",
    },
    {
        "id": "prince_andrew",
        "name": "Prince Andrew",
        "role": "associate",
        "network": "epstein",
        "doc_count": 2000,
        "status": "not-charged",
        "section": 5,
        "notes": "Tier 2 #10. Epstein introduced '26, russian, clevere beautiful' woman. Thirsk £126K claims.",
    },
    {
        "id": "peter_mandelson",
        "name": "Peter Mandelson",
        "role": "associate",
        "network": "epstein",
        "doc_count": 1200,
        "status": "under-investigation",
        "section": 5,
        "notes": "Tier 2 #11. Advance notice of 500B euro EU bailout. $75K payments. Met Police investigating.",
    },
    {
        "id": "valdson_cotrin",
        "name": "Valdson Cotrin",
        "role": "staff",
        "network": "epstein",
        "doc_count": 1936,
        "status": "not-charged",
        "section": 3,
        "notes": "Tier 2 #13. Distributed cash to women in Paris on Epstein's orders.",
    },

    # --- Tier 3: Incriminating statements ---
    {
        "id": "deepak_chopra",
        "name": "Deepak Chopra",
        "role": "associate",
        "network": "epstein",
        "doc_count": 600,
        "status": "not-charged",
        "section": 5,
        "notes": "Tier 3 #14. 'God is a construct. Cute girls are real.' 'Bring your girls' with fake name.",
    },
    {
        "id": "elon_musk",
        "name": "Elon Musk",
        "role": "associate",
        "network": "epstein",
        "doc_count": 400,
        "status": "not-charged",
        "section": 5,
        "notes": "Tier 3 #18. 'What day/night will be the wildest party on your island?' 16+ emails 2012-2013.",
    },
    {
        "id": "howard_lutnick",
        "name": "Howard Lutnick",
        "role": "associate",
        "network": "epstein",
        "doc_count": 350,
        "status": "not-charged",
        "section": 5,
        "notes": "Tier 3 #21. Lied to Congress about last contact. 2012 island visit. Adfin LLC partnership.",
    },
    {
        "id": "david_stern",
        "name": "David Stern",
        "role": "associate",
        "network": "epstein",
        "doc_count": 300,
        "status": "not-charged",
        "section": 5,
        "notes": "Tier 3 #17. 'My team. Anyone cute?' Coordinated Prince Andrew's access.",
    },
    {
        "id": "leon_botstein",
        "name": "Leon Botstein",
        "role": "associate",
        "network": "epstein",
        "doc_count": 250,
        "status": "not-charged",
        "section": 5,
        "notes": "Tier 3 #20. Helicopter ride with 'girls' to island. $56K Patek Philippe watch.",
    },
    {
        "id": "sultan_bin_sulayem",
        "name": "Sultan Bin Sulayem",
        "role": "associate",
        "network": "epstein",
        "doc_count": 200,
        "status": "not-charged",
        "section": 5,
        "notes": "Tier 3 #15. 'I loved the torture video.' Named by Massie and Khanna.",
    },
    {
        "id": "miroslav_lajcak",
        "name": "Miroslav Lajcak",
        "role": "associate",
        "network": "epstein",
        "doc_count": 300,
        "status": "not-charged",
        "section": 5,
        "notes": "Tier 3 #16. 'Girls here are as gorgeous as ever :)' / 'I would take the MI girl.' Resigned.",
    },
    {
        "id": "roger_schank",
        "name": "Roger Schank",
        "role": "associate",
        "network": "epstein",
        "doc_count": 1565,
        "status": "not-charged",
        "section": 5,
        "notes": "Tier 3 #19. 'Shvartzers ready to go' — racist email with photos of Black women.",
    },

    # --- Tier 4: Financial entanglement ---
    {
        "id": "peter_thiel",
        "name": "Peter Thiel",
        "role": "financier",
        "network": "epstein",
        "doc_count": 500,
        "status": "not-charged",
        "section": 7,
        "notes": "Tier 4 #22. $40M Valar Ventures. 'I never question your judgment.'",
    },
    {
        "id": "leon_black",
        "name": "Leon Black",
        "role": "financier",
        "network": "epstein",
        "doc_count": 800,
        "status": "not-charged",
        "section": 7,
        "notes": "Tier 4 #23. $158M in transfers over 5 years. Apollo Global co-founder.",
    },
    {
        "id": "terje_rod_larsen",
        "name": "Terje Rod-Larsen",
        "role": "associate",
        "network": "epstein",
        "doc_count": 1500,
        "status": "charged",
        "section": 5,
        "notes": "Tier 4 #24. $11M+ total. 'Best friend' / 'thoroughly good human being.' Charged complicity gross corruption.",
    },
    {
        "id": "mort_zuckerman",
        "name": "Mort Zuckerman",
        "role": "financier",
        "network": "epstein",
        "doc_count": 600,
        "status": "not-charged",
        "section": 7,
        "notes": "Tier 4 #25. $21M STC agreement. Daily News/US News/Boston Properties.",
    },
    {
        "id": "jimmy_cayne",
        "name": "Jimmy Cayne",
        "role": "financier",
        "network": "epstein",
        "doc_count": 154,
        "status": "not-charged",
        "section": 7,
        "notes": "Tier 4 #26. Post-conviction contact. Epstein used 'Bear Stearns / Jimmy Cayne' as employer ref for Russian visa.",
    },

    # --- Inner circle / Staff ---
    {
        "id": "darren_indyke",
        "name": "Darren Indyke",
        "role": "staff",
        "network": "epstein",
        "doc_count": 5000,
        "status": "not-charged",
        "section": 3,
        "notes": "Attorney / Authorized Agent. Estate co-executor. Listed on dozens of Epstein LLCs.",
    },
    {
        "id": "richard_kahn",
        "name": "Richard Kahn",
        "role": "staff",
        "network": "epstein",
        "doc_count": 3000,
        "status": "not-charged",
        "section": 3,
        "notes": "Accountant / Agent. All employees required to contact Kahn if contacted by law enforcement.",
    },
    {
        "id": "david_rogers",
        "name": "David Rogers",
        "role": "staff",
        "network": "epstein",
        "doc_count": 2000,
        "status": "not-charged",
        "section": 3,
        "notes": "Pilot. Maintained flight logs ('Lolita Express'). 'Remain loyal to JE.'",
    },
    {
        "id": "larry_visoski",
        "name": "Larry Visoski",
        "role": "staff",
        "network": "epstein",
        "doc_count": 1800,
        "status": "not-charged",
        "section": 3,
        "notes": "Pilot. Testified at Maxwell trial. Managed N212JE and N908JE.",
    },
    {
        "id": "juan_alessi",
        "name": "Juan Alessi",
        "role": "staff",
        "network": "epstein",
        "doc_count": 1000,
        "status": "not-charged",
        "section": 3,
        "notes": "Former FL household manager 1989-2002. Witnessed Maxwell recruit 15-16yo at Mar-a-Lago.",
    },
    {
        "id": "karyna_shuliak",
        "name": "Karyna Shuliak",
        "role": "associate",
        "network": "epstein",
        "doc_count": 36394,
        "status": "not-charged",
        "section": 1,
        "notes": "Last girlfriend. Dentist (DDS). Belarus-born. 36,394 docs — most mentioned individual.",
    },

    # --- South Florida network ---
    {
        "id": "sky_roberts",
        "name": "Sky Roberts",
        "role": "external-predator",
        "network": "epstein",
        "doc_count": 100,
        "status": "not-charged",
        "section": 0,
        "notes": "Virginia's father. Mar-a-Lago maintenance. Alleged familial sexual abuse from age 7.",
    },
    {
        "id": "ron_eppinger",
        "name": "Ron Eppinger",
        "role": "external-predator",
        "network": "epstein",
        "doc_count": 200,
        "status": "deceased",
        "section": 0,
        "notes": "Perfect 10 magazine. FL 794.011(8) familial sexual abuse. Trafficking ring 1990s.",
    },
    {
        "id": "virginia_giuffre",
        "name": "Virginia Giuffre",
        "role": "victim-identified",
        "network": "epstein",
        "doc_count": 15000,
        "status": "deceased",
        "section": 0,
        "notes": "Key witness. Recruited at Mar-a-Lago age 16. Died 2025. Memoir: Nobody's Girl.",
    },
    {
        "id": "peter_nygard",
        "name": "Peter Nygard",
        "role": "external-predator",
        "network": "nygard",
        "doc_count": 500,
        "status": "convicted",
        "section": 0,
        "notes": "Nygard Cay, Bahamas. Convicted sex trafficking. FBI C-20 investigated alongside Epstein.",
    },

    # --- Modeling pipeline ---
    {
        "id": "faith_kates",
        "name": "Faith Kates",
        "role": "associate",
        "network": "epstein",
        "doc_count": 5210,
        "status": "not-charged",
        "section": 5,
        "notes": "Next Model Management founder. 5,210 docs. Largely unexplored.",
    },
    {
        "id": "paolo_zampolli",
        "name": "Paolo Zampolli",
        "role": "associate",
        "network": "epstein",
        "doc_count": 400,
        "status": "not-charged",
        "section": 5,
        "notes": "ID Models founder. Trump connection.",
    },
    {
        "id": "fabrice_aidan",
        "name": "Fabrice Aidan",
        "role": "associate",
        "network": "epstein",
        "doc_count": 300,
        "status": "not-charged",
        "section": 5,
        "notes": "UN official. Ordered shoes through his UN office for Kellen.",
    },

    # --- Other associates ---
    {
        "id": "boris_nikolic",
        "name": "Boris Nikolic",
        "role": "associate",
        "network": "epstein",
        "doc_count": 400,
        "status": "not-charged",
        "section": 5,
        "notes": "Named as backup executor in Epstein's will signed 2 days before death.",
    },
    {
        "id": "peggy_siegal",
        "name": "Peggy Siegal",
        "role": "associate",
        "network": "epstein",
        "doc_count": 300,
        "status": "not-charged",
        "section": 5,
        "notes": "Hollywood publicist. Hosted Epstein at events post-conviction.",
    },
    {
        "id": "david_geffen",
        "name": "David Geffen",
        "role": "associate",
        "network": "epstein",
        "doc_count": 200,
        "status": "not-charged",
        "section": 5,
        "notes": "DreamWorks co-founder. October 2012 master contacts list.",
    },
    {
        "id": "reid_hoffman",
        "name": "Reid Hoffman",
        "role": "associate",
        "network": "epstein",
        "doc_count": 200,
        "status": "not-charged",
        "section": 5,
        "notes": "LinkedIn co-founder. October 2012 contacts list.",
    },
    {
        "id": "jack_lang",
        "name": "Jack Lang",
        "role": "associate",
        "network": "epstein",
        "doc_count": 300,
        "status": "charged",
        "section": 5,
        "notes": "Former French Minister. Charged 'aggravated tax fraud laundering.'",
    },
    {
        "id": "princess_mette_marit",
        "name": "Princess Mette-Marit",
        "role": "associate",
        "network": "epstein",
        "doc_count": 100,
        "status": "not-charged",
        "section": 5,
        "notes": "Crown Princess of Norway. October 2012 contacts.",
    },
    {
        "id": "thorbjorn_jagland",
        "name": "Thorbjorn Jagland",
        "role": "associate",
        "network": "epstein",
        "doc_count": 150,
        "status": "not-charged",
        "section": 5,
        "notes": "Council of Europe Secretary General. October 2012 contacts.",
    },
    {
        "id": "heather_mann",
        "name": "Heather Mann",
        "role": "associate",
        "network": "epstein",
        "doc_count": 500,
        "status": "not-charged",
        "section": 5,
        "notes": "'Sweet pea'/'Q'. London-based. ~$20M blue diamond chain.",
    },
    {
        "id": "lucy_clive",
        "name": "Lucy Clive",
        "role": "associate",
        "network": "epstein",
        "doc_count": 200,
        "status": "not-charged",
        "section": 1,
        "notes": "Probable SITREP #7. Kevin Maxwell's girlfriend. Terramar co-director.",
    },
    {
        "id": "etienne_binant",
        "name": "Etienne Binant",
        "role": "staff",
        "network": "epstein",
        "doc_count": 400,
        "status": "not-charged",
        "section": 3,
        "notes": "'eitienn'. Technical/property staff.",
    },
    {
        "id": "jes_staley",
        "name": "Jes Staley",
        "role": "associate",
        "network": "epstein",
        "doc_count": 1000,
        "status": "not-charged",
        "section": 5,
        "notes": "Former Barclays CEO. JPMorgan exec who managed Epstein accounts.",
    },
    {
        "id": "glenn_dubin",
        "name": "Glenn Dubin",
        "role": "associate",
        "network": "epstein",
        "doc_count": 800,
        "status": "not-charged",
        "section": 5,
        "notes": "Highbridge Capital. Named by multiple victims.",
    },
    {
        "id": "bill_clinton",
        "name": "Bill Clinton",
        "role": "associate",
        "network": "epstein",
        "doc_count": 1500,
        "status": "not-charged",
        "section": 5,
        "notes": "Multiple flights. Deposition Feb 26-27, 2026. FBI notes: 'three women not under age @ USVI.'",
    },
    {
        "id": "alan_dershowitz",
        "name": "Alan Dershowitz",
        "role": "associate",
        "network": "epstein",
        "doc_count": 3000,
        "status": "not-charged",
        "section": 5,
        "notes": "Epstein defense attorney. Accused by Giuffre (settled).",
    },
    {
        "id": "larry_summers",
        "name": "Larry Summers",
        "role": "associate",
        "network": "epstein",
        "doc_count": 300,
        "status": "not-charged",
        "section": 5,
        "notes": "Former Treasury Secretary. Harvard president during Epstein donations.",
    },
    {
        "id": "andrew_farkas",
        "name": "Andrew Farkas",
        "role": "associate",
        "network": "epstein",
        "doc_count": 9150,
        "status": "not-charged",
        "section": 5,
        "notes": "Island Hospitality Management. 9,150 docs. iMessages through 2019.",
    },
    {
        "id": "george_delson",
        "name": "George Delson",
        "role": "associate",
        "network": "epstein",
        "doc_count": 634,
        "status": "not-charged",
        "section": 0,
        "notes": "634 docs. Needs investigation.",
    },
]


# ---------------------------------------------------------------------------
# ORGANIZATIONS
# ---------------------------------------------------------------------------
ORGANIZATIONS = [
    # Epstein entities
    {
        "id": "southern_trust_company",
        "name": "Southern Trust Company",
        "org_type": "financial",
        "network": "epstein",
        "doc_count": 2000,
        "status": "dissolved",
        "notes": "Epstein's primary financial vehicle. STC agreements with Zuckerman et al.",
    },
    {
        "id": "hbrk_associates",
        "name": "HBRK Associates",
        "org_type": "company",
        "network": "epstein",
        "doc_count": 500,
        "status": "dissolved",
        "notes": "Epstein business entity.",
    },
    {
        "id": "gratitude_america",
        "name": "Gratitude America",
        "org_type": "foundation",
        "network": "epstein",
        "doc_count": 300,
        "status": "dissolved",
        "notes": "Epstein foundation. Tax-exempt vehicle.",
    },

    # Modeling agencies
    {
        "id": "mc2_models",
        "name": "MC2 Model Management",
        "org_type": "modeling-agency",
        "network": "epstein",
        "doc_count": 2000,
        "status": "dissolved",
        "notes": "Founded by Brunel with Epstein financing. Primary procurement pipeline.",
    },
    {
        "id": "next_models",
        "name": "Next Model Management",
        "org_type": "modeling-agency",
        "network": "epstein",
        "doc_count": 1000,
        "status": "active",
        "notes": "Brunel had 50% ownership through Epstein.",
    },
    {
        "id": "karin_models",
        "name": "Karin Models",
        "org_type": "modeling-agency",
        "network": "epstein",
        "doc_count": 500,
        "status": "active",
        "notes": "Paris modeling agency in Epstein network.",
    },
    {
        "id": "id_models",
        "name": "ID Models",
        "org_type": "modeling-agency",
        "network": "epstein",
        "doc_count": 300,
        "status": "active",
        "notes": "Zampolli's agency.",
    },

    # Financial
    {
        "id": "bear_stearns",
        "name": "Bear Stearns",
        "org_type": "financial",
        "network": "epstein",
        "doc_count": 500,
        "status": "dissolved",
        "notes": "Epstein's early career. Cayne connection.",
    },
    {
        "id": "apollo_global",
        "name": "Apollo Global Management",
        "org_type": "financial",
        "network": "epstein",
        "doc_count": 400,
        "status": "active",
        "notes": "Leon Black co-founded. $158M to Epstein.",
    },
    {
        "id": "l_brands",
        "name": "L Brands / The Limited",
        "org_type": "company",
        "network": "epstein",
        "doc_count": 800,
        "status": "active",
        "notes": "Wexner's company. Victoria's Secret parent.",
    },
    {
        "id": "victorias_secret",
        "name": "Victoria's Secret",
        "org_type": "company",
        "network": "epstein",
        "doc_count": 600,
        "status": "active",
        "notes": "Brunel used VS casting calls as recruitment tool.",
    },
    {
        "id": "valar_ventures",
        "name": "Valar Ventures",
        "org_type": "financial",
        "network": "epstein",
        "doc_count": 200,
        "status": "active",
        "notes": "Thiel's fund. $40M Epstein investment. Largest estate asset.",
    },

    # Foundations
    {
        "id": "edge_foundation",
        "name": "Edge Foundation",
        "org_type": "foundation",
        "network": "epstein",
        "doc_count": 400,
        "status": "dissolved",
        "notes": "John Brockman's science salon. $638K from Epstein.",
    },
    {
        "id": "wexner_foundation",
        "name": "Wexner Foundation",
        "org_type": "foundation",
        "network": "epstein",
        "doc_count": 300,
        "status": "active",
        "notes": "Leslie Wexner's philanthropic vehicle.",
    },
    {
        "id": "clinton_foundation",
        "name": "Clinton Foundation",
        "org_type": "foundation",
        "network": "epstein",
        "doc_count": 200,
        "status": "active",
        "notes": "Epstein donations and flight connections.",
    },
]


# ---------------------------------------------------------------------------
# LOCATIONS
# ---------------------------------------------------------------------------
LOCATIONS = [
    {
        "id": "mar_a_lago",
        "name": "Mar-a-Lago",
        "location_type": "club",
        "network": "epstein",
        "doc_count": 800,
        "status": "active",
        "notes": "Palm Beach club. Virginia Giuffre recruited here by Maxwell. Sky Roberts employed here.",
    },
    {
        "id": "nine_east_71st",
        "name": "9 East 71st Street",
        "location_type": "residence",
        "network": "epstein",
        "doc_count": 3000,
        "status": "seized",
        "notes": "$77M Manhattan mansion. Gifted by Wexner. Primary NYC abuse location.",
    },
    {
        "id": "little_st_james",
        "name": "Little St. James Island",
        "location_type": "island",
        "network": "epstein",
        "doc_count": 5000,
        "status": "seized",
        "notes": "Private island, USVI. Purchased 1998. Primary offshore abuse site.",
    },
    {
        "id": "great_st_james",
        "name": "Great St. James Island",
        "location_type": "island",
        "network": "epstein",
        "doc_count": 500,
        "status": "seized",
        "notes": "Second USVI island. Purchased 2016.",
    },
    {
        "id": "avenue_foch",
        "name": "Avenue Foch Apartment",
        "location_type": "residence",
        "network": "epstein",
        "doc_count": 1500,
        "status": "seized",
        "notes": "Paris apartment, 16th arrondissement. Cotrin managed. Cash distributed to women here.",
    },
    {
        "id": "el_brillo_way",
        "name": "El Brillo Way",
        "location_type": "residence",
        "network": "epstein",
        "doc_count": 4000,
        "status": "seized",
        "notes": "Palm Beach mansion. Primary FL abuse location. Alessi managed 1989-2002.",
    },
]


# ---------------------------------------------------------------------------
# EDGES
# ---------------------------------------------------------------------------
EDGES = [
    # ===== MONEY =====

    # Wexner -> Epstein
    {
        "type": "MONEY",
        "source": "leslie_wexner",
        "target": "jeffrey_epstein",
        "props": {
            "amount": 46000000.0,
            "date": "1990s-2000s",
            "description": "Total transfers including mansion gift and power of attorney",
            "source_doc": "EFTA01110729",
            "doc_url": doc_url("EFTA01110729", 9),
        },
    },
    # Epstein -> Maxwell (financial support)
    {
        "type": "MONEY",
        "source": "jeffrey_epstein",
        "target": "ghislaine_maxwell",
        "props": {
            "amount": 5000000.0,
            "date": "2000s",
            "description": "Millions through NES LLC and Air Ghislaine Inc",
            "source_doc": "EFTA01682065",
            "doc_url": doc_url("EFTA01682065", 10),
        },
    },
    # Leon Black -> Epstein
    {
        "type": "MONEY",
        "source": "leon_black",
        "target": "jeffrey_epstein",
        "props": {
            "amount": 158000000.0,
            "date": "2013-2018",
            "description": "Tax structuring fees via Richard Kahn over 5 years",
            "source_doc": "EFTA02467352",
            "doc_url": doc_url("EFTA02467352", 11),
        },
    },
    # Thiel -> Epstein (Valar)
    {
        "type": "MONEY",
        "source": "jeffrey_epstein",
        "target": "peter_thiel",
        "target_type": "Person",
        "props": {
            "amount": 40000000.0,
            "date": "2011",
            "description": "$40M Valar Ventures investment (~$170M current value)",
            "source_doc": "EFTA02491051",
            "doc_url": doc_url("EFTA02491051", 11),
        },
    },
    # Zuckerman STC
    {
        "type": "MONEY",
        "source": "mort_zuckerman",
        "target": "jeffrey_epstein",
        "props": {
            "amount": 21000000.0,
            "date": "2000s",
            "description": "$21M STC agreement for estate planning",
            "source_doc": "EFTA01140740",
            "doc_url": doc_url("EFTA01140740", 9),
        },
    },
    # Rod-Larsen from Epstein
    {
        "type": "MONEY",
        "source": "jeffrey_epstein",
        "target": "terje_rod_larsen",
        "props": {
            "amount": 11000000.0,
            "date": "2005-2019",
            "description": "$1M Zuckerman deal + $10M bequest. Total $11M+.",
            "source_doc": "EFTA02342845",
            "doc_url": doc_url("EFTA02342845", 11),
        },
    },
    # Mandelson payments
    {
        "type": "MONEY",
        "source": "jeffrey_epstein",
        "target": "peter_mandelson",
        "props": {
            "amount": 75000.0,
            "date": "2009-2011",
            "description": "3 x $25K payments",
        },
    },
    # Figueroa payments
    {
        "type": "MONEY",
        "source": "jeffrey_epstein",
        "target": "tony_figueroa",
        "props": {
            "amount": 200.0,
            "date": "2000-2005",
            "description": "$200 apiece per girl recruited",
            "source_doc": "EFTA01682078",
            "doc_url": doc_url("EFTA01682078", 10),
        },
    },
    # Epstein -> MC2 funding
    {
        "type": "MONEY",
        "source": "jeffrey_epstein",
        "target_org": "mc2_models",
        "props": {
            "amount": 1000000.0,
            "date": "2000s",
            "description": "Funded MC2 Model Management founding",
        },
    },
    # Epstein -> Valar Ventures
    {
        "type": "MONEY",
        "source": "jeffrey_epstein",
        "target_org": "valar_ventures",
        "props": {
            "amount": 40000000.0,
            "date": "2011",
            "description": "$40M investment, largest estate asset",
            "source_doc": "EFTA02491051",
            "doc_url": doc_url("EFTA02491051", 11),
        },
    },
    # Prince Andrew financial
    {
        "type": "MONEY",
        "source": "jeffrey_epstein",
        "target": "prince_andrew",
        "props": {
            "amount": 126000.0,
            "date": "2010s",
            "description": "Thirsk £126,721 claims + $59K Columbia debt",
            "source_doc": "EFTA00632493",
            "doc_url": doc_url("EFTA00632493", 9),
        },
    },

    # ===== COMMUNICATION =====

    # Siad -> Epstein (girls staying with me)
    {
        "type": "COMMUNICATION",
        "source": "daniel_siad",
        "target": "jeffrey_epstein",
        "props": {
            "date": "2017-06-26",
            "channel": "skype",
            "quote": "I have girls staying with me from Australia Croecian origin, so you can speak with her very Sweet",
            "source_doc": "EFTA01209254",
            "doc_url": doc_url("EFTA01209254", 9),
        },
    },
    # Epstein -> Siad (just dark hair)
    {
        "type": "COMMUNICATION",
        "source": "jeffrey_epstein",
        "target": "daniel_siad",
        "props": {
            "date": "2017-04",
            "channel": "skype",
            "quote": "just dark hair",
            "source_doc": "EFTA01621978",
            "doc_url": doc_url("EFTA01621978", 10),
        },
    },
    # Musk -> Epstein (wildest party)
    {
        "type": "COMMUNICATION",
        "source": "elon_musk",
        "target": "jeffrey_epstein",
        "props": {
            "date": "2012-2013",
            "channel": "email",
            "quote": "What day/night will be the wildest party on your island?",
            "source_doc": "EFTA01977056",
            "doc_url": doc_url("EFTA01977056", 10),
        },
    },
    # Chopra -> Epstein (bring your girls)
    {
        "type": "COMMUNICATION",
        "source": "deepak_chopra",
        "target": "jeffrey_epstein",
        "props": {
            "date": "2010s",
            "channel": "email",
            "quote": "God is a construct. Cute girls are real. Bring your girls.",
        },
    },
    # Bin Sulayem -> Epstein (torture video)
    {
        "type": "COMMUNICATION",
        "source": "sultan_bin_sulayem",
        "target": "jeffrey_epstein",
        "props": {
            "date": "2010s",
            "channel": "email",
            "quote": "I loved the torture video.",
            "source_doc": "EFTA00666117",
            "doc_url": doc_url("EFTA00666117", 9),
        },
    },
    # Lajcak -> Epstein
    {
        "type": "COMMUNICATION",
        "source": "miroslav_lajcak",
        "target": "jeffrey_epstein",
        "props": {
            "date": "2010s",
            "channel": "email",
            "quote": "Girls here are as gorgeous as ever :) / I would take the MI girl.",
        },
    },
    # Schank -> Epstein (racist email)
    {
        "type": "COMMUNICATION",
        "source": "roger_schank",
        "target": "jeffrey_epstein",
        "props": {
            "date": "2010s",
            "channel": "email",
            "quote": "Shvartzers ready to go",
            "source_doc": "EFTA00771523",
            "doc_url": doc_url("EFTA00771523", 9),
        },
    },
    # Stern -> Epstein (anyone cute)
    {
        "type": "COMMUNICATION",
        "source": "david_stern",
        "target": "jeffrey_epstein",
        "props": {
            "date": "2010s",
            "channel": "email",
            "quote": "My team. Anyone cute?",
            "source_doc": "EFTA01612488",
            "doc_url": doc_url("EFTA01612488", 10),
        },
    },
    # Epstein -> Maxwell (maralago age calculation)
    {
        "type": "COMMUNICATION",
        "source": "jeffrey_epstein",
        "target": "ghislaine_maxwell",
        "props": {
            "date": "2015",
            "channel": "email",
            "quote": "for her leaving maralago she would have been 17",
            "source_doc": "EFTA00907548",
            "doc_url": doc_url("EFTA00907548", 9),
        },
    },
    # Rod-Larsen -> Epstein (best friend)
    {
        "type": "COMMUNICATION",
        "source": "terje_rod_larsen",
        "target": "jeffrey_epstein",
        "props": {
            "date": "2017",
            "channel": "email",
            "quote": "best friend / thoroughly good human being",
        },
    },
    # Mandelson -> Epstein (EU bailout)
    {
        "type": "COMMUNICATION",
        "source": "peter_mandelson",
        "target": "jeffrey_epstein",
        "props": {
            "date": "2010",
            "channel": "email",
            "quote": "Advance notice of 500B euro EU bailout",
        },
    },

    # ===== RELATIONSHIP =====

    # Maxwell recruited Giuffre
    {
        "type": "RELATIONSHIP",
        "source": "ghislaine_maxwell",
        "target": "virginia_giuffre",
        "props": {
            "description": "Recruited Virginia at Mar-a-Lago spa age 16",
            "confidence": "confirmed",
            "source_doc": "EFTA00627719",
            "doc_url": doc_url("EFTA00627719", 9),
        },
    },
    # Figueroa recruited for Maxwell
    {
        "type": "RELATIONSHIP",
        "source": "ghislaine_maxwell",
        "target": "tony_figueroa",
        "props": {
            "description": "Maxwell called Figueroa 'asking me to get girls'",
            "confidence": "confirmed",
            "source_doc": "EFTA00097816",
            "doc_url": doc_url("EFTA00097816", 9),
        },
    },
    # Sky Roberts -> Virginia (father)
    {
        "type": "RELATIONSHIP",
        "source": "sky_roberts",
        "target": "virginia_giuffre",
        "props": {
            "description": "Father. Alleged sexual abuse from age 7. Drove her to Epstein's house.",
            "confidence": "confirmed",
        },
    },
    # Eppinger -> Virginia
    {
        "type": "RELATIONSHIP",
        "source": "ron_eppinger",
        "target": "virginia_giuffre",
        "props": {
            "description": "Picked up Virginia age 13-15 (1998). Trafficking ring.",
            "confidence": "confirmed",
        },
    },
    # Brunel identified Siad
    {
        "type": "RELATIONSHIP",
        "source": "jean_luc_brunel",
        "target": "daniel_siad",
        "props": {
            "description": "Siad 'identified by Brunel' in FBI targeting document",
            "confidence": "confirmed",
            "source_doc": "EFTA01682078",
            "doc_url": doc_url("EFTA01682078", 10),
        },
    },
    # Epstein -> Kellen (scheduler)
    {
        "type": "RELATIONSHIP",
        "source": "jeffrey_epstein",
        "target": "sarah_kellen",
        "props": {
            "description": "Kellen scheduled abuse sessions and managed Epstein's calendar of young women",
            "confidence": "confirmed",
        },
    },
    # Epstein -> Groff (assistant)
    {
        "type": "RELATIONSHIP",
        "source": "jeffrey_epstein",
        "target": "lesley_groff",
        "props": {
            "description": "Executive assistant. Coordinated all logistics for decades.",
            "confidence": "confirmed",
        },
    },
    # Epstein -> Marcinkova
    {
        "type": "RELATIONSHIP",
        "source": "jeffrey_epstein",
        "target": "nadia_marcinkova",
        "props": {
            "description": "Brought from Yugoslavia as minor. Dual victim/participant.",
            "confidence": "confirmed",
        },
    },
    # Epstein -> Ross
    {
        "type": "RELATIONSHIP",
        "source": "jeffrey_epstein",
        "target": "adriana_ross",
        "props": {
            "description": "Former model turned assistant. Removed evidence during search warrant.",
            "confidence": "confirmed",
        },
    },
    # Epstein -> Brunel (MC2 partnership)
    {
        "type": "RELATIONSHIP",
        "source": "jeffrey_epstein",
        "target": "jean_luc_brunel",
        "props": {
            "description": "Funded MC2 and used it as procurement pipeline",
            "confidence": "confirmed",
        },
    },
    # Stern -> Prince Andrew
    {
        "type": "RELATIONSHIP",
        "source": "david_stern",
        "target": "prince_andrew",
        "props": {
            "description": "Coordinated Prince Andrew's access to Epstein network",
            "confidence": "confirmed",
            "source_doc": "EFTA01612488",
            "doc_url": doc_url("EFTA01612488", 10),
        },
    },
    # Lutnick island visit
    {
        "type": "RELATIONSHIP",
        "source": "howard_lutnick",
        "target": "jeffrey_epstein",
        "props": {
            "description": "2012 island visit. 2011 home meeting. Adfin LLC partnership.",
            "confidence": "confirmed",
            "source_doc": "EFTA00289722",
            "doc_url": doc_url("EFTA00289722", 9),
        },
    },
    # Dershowitz defense
    {
        "type": "RELATIONSHIP",
        "source": "alan_dershowitz",
        "target": "jeffrey_epstein",
        "props": {
            "description": "Defense attorney. Also accused by Giuffre (settled).",
            "confidence": "confirmed",
        },
    },
    # Clinton flights
    {
        "type": "RELATIONSHIP",
        "source": "bill_clinton",
        "target": "jeffrey_epstein",
        "props": {
            "description": "Multiple flights on Epstein aircraft. USVI visits.",
            "confidence": "confirmed",
        },
    },
    # Summers
    {
        "type": "RELATIONSHIP",
        "source": "larry_summers",
        "target": "jeffrey_epstein",
        "props": {
            "description": "Harvard president during Epstein donations. Flight logs.",
            "confidence": "confirmed",
        },
    },

    # ===== DOCUMENT (co-occurrence) =====

    # SITREP co-occurrences
    {
        "type": "DOCUMENT",
        "source": "ghislaine_maxwell",
        "target": "lesley_groff",
        "props": {
            "doc_id": "EFTA00173201",
            "description": "Both named as co-conspirators in FBI SITREP",
            "doc_url": doc_url("EFTA00173201", 9),
        },
    },
    {
        "type": "DOCUMENT",
        "source": "jean_luc_brunel",
        "target": "leslie_wexner",
        "props": {
            "doc_id": "EFTA00173201",
            "description": "Both named as co-conspirators in FBI SITREP",
            "doc_url": doc_url("EFTA00173201", 9),
        },
    },
    # Inner circle memo
    {
        "type": "DOCUMENT",
        "source": "darren_indyke",
        "target": "richard_kahn",
        "props": {
            "doc_id": "EFTA00098755",
            "description": "Both named in inner circle memo",
            "doc_url": doc_url("EFTA00098755", 9),
        },
    },
    # FBI targeting document
    {
        "type": "DOCUMENT",
        "source": "daniel_siad",
        "target": "jean_luc_brunel",
        "props": {
            "doc_id": "EFTA01682078",
            "description": "Siad 'identified by Brunel' in FBI targeting document",
            "doc_url": doc_url("EFTA01682078", 10),
        },
    },
    # Wexner gang stuff letter
    {
        "type": "DOCUMENT",
        "source": "leslie_wexner",
        "target": "jeffrey_epstein",
        "props": {
            "doc_id": "EFTA01110729",
            "description": "Draft letter: 'gang stuff for over 15 years'",
            "doc_url": doc_url("EFTA01110729", 9),
        },
    },

    # ===== AFFILIATION =====

    # Brunel -> MC2
    {
        "type": "AFFILIATION",
        "source": "jean_luc_brunel",
        "target_org": "mc2_models",
        "props": {
            "role": "Founder/CEO",
            "date": "2000s",
            "description": "Founded MC2 with Epstein financing",
        },
    },
    # Zampolli -> ID Models
    {
        "type": "AFFILIATION",
        "source": "paolo_zampolli",
        "target_org": "id_models",
        "props": {
            "role": "Founder",
            "date": "1998",
            "description": "Founded ID Models",
        },
    },
    # Faith Kates -> Next Models
    {
        "type": "AFFILIATION",
        "source": "faith_kates",
        "target_org": "next_models",
        "props": {
            "role": "Founder",
            "date": "1989",
            "description": "Founded Next Model Management",
        },
    },
    # Wexner -> L Brands
    {
        "type": "AFFILIATION",
        "source": "leslie_wexner",
        "target_org": "l_brands",
        "props": {
            "role": "CEO/Chairman",
            "date": "1963-2020",
            "description": "Founded The Limited, grew into L Brands empire",
        },
    },
    # Black -> Apollo
    {
        "type": "AFFILIATION",
        "source": "leon_black",
        "target_org": "apollo_global",
        "props": {
            "role": "Co-founder/Chairman",
            "date": "1990-2021",
            "description": "Co-founded Apollo. Stepped down after Epstein ties revealed.",
        },
    },
    # Thiel -> Valar
    {
        "type": "AFFILIATION",
        "source": "peter_thiel",
        "target_org": "valar_ventures",
        "props": {
            "role": "Founder",
            "date": "2010",
            "description": "Founded Valar Ventures",
        },
    },
    # Cayne -> Bear Stearns
    {
        "type": "AFFILIATION",
        "source": "jimmy_cayne",
        "target_org": "bear_stearns",
        "props": {
            "role": "CEO/Chairman",
            "date": "1993-2008",
            "description": "Led Bear Stearns. Epstein's former employer.",
        },
    },
    # Epstein -> Bear Stearns (early career)
    {
        "type": "AFFILIATION",
        "source": "jeffrey_epstein",
        "target_org": "bear_stearns",
        "props": {
            "role": "Employee/Trader",
            "date": "1976-1981",
            "description": "Early career at Bear Stearns",
        },
    },
    # Indyke -> Nine East 71st
    {
        "type": "AFFILIATION",
        "source": "darren_indyke",
        "target_loc": "nine_east_71st",
        "props": {
            "role": "Listed owner/DVS",
            "date": "2000s",
            "description": "Listed on Nine East 71st Street Corporation",
            "source_doc": "EFTA01297830",
            "doc_url": doc_url("EFTA01297830", 10),
        },
    },
    # Kahn -> STC
    {
        "type": "AFFILIATION",
        "source": "richard_kahn",
        "target_org": "southern_trust_company",
        "props": {
            "role": "Accountant/Agent",
            "date": "2000s",
            "description": "Managed Epstein's financial instruments through STC",
        },
    },
    # Visoski -> pilot affiliation
    {
        "type": "AFFILIATION",
        "source": "larry_visoski",
        "target_loc": "little_st_james",
        "props": {
            "role": "Chief pilot",
            "date": "1990s-2019",
            "description": "Flew N212JE and N908JE to island",
        },
    },
    # Rogers -> pilot
    {
        "type": "AFFILIATION",
        "source": "david_rogers",
        "target_loc": "little_st_james",
        "props": {
            "role": "Pilot",
            "date": "1990s-2019",
            "description": "Maintained flight logs for island trips",
        },
    },
    # Clinton -> Clinton Foundation
    {
        "type": "AFFILIATION",
        "source": "bill_clinton",
        "target_org": "clinton_foundation",
        "props": {
            "role": "Founder",
            "date": "2001",
            "description": "Founded Clinton Foundation",
        },
    },
    # Alessi -> El Brillo Way
    {
        "type": "AFFILIATION",
        "source": "juan_alessi",
        "target_loc": "el_brillo_way",
        "props": {
            "role": "House manager",
            "date": "1989-2002",
            "description": "Managed Palm Beach property for ~13 years",
        },
    },
    # Sky Roberts -> Mar-a-Lago
    {
        "type": "AFFILIATION",
        "source": "sky_roberts",
        "target_loc": "mar_a_lago",
        "props": {
            "role": "Maintenance worker",
            "date": "2000-2003+",
            "description": "Hired Apr 2000 at $12/hr. Trump: 'most valuable employee.'",
        },
    },
    # Virginia -> Mar-a-Lago
    {
        "type": "AFFILIATION",
        "source": "virginia_giuffre",
        "target_loc": "mar_a_lago",
        "props": {
            "role": "Locker room attendant",
            "date": "2000",
            "description": "$9/hr spa worker. Recruited by Maxwell here.",
        },
    },
    # Cotrin -> Avenue Foch
    {
        "type": "AFFILIATION",
        "source": "valdson_cotrin",
        "target_loc": "avenue_foch",
        "props": {
            "role": "House manager",
            "date": "2000s-2019",
            "description": "Managed Paris apartment. Distributed cash to women.",
        },
    },
    # Staley affiliation
    {
        "type": "AFFILIATION",
        "source": "jes_staley",
        "target_org": "bear_stearns",
        "props": {
            "role": "JPMorgan executive",
            "date": "2000s",
            "description": "Managed Epstein accounts at JPMorgan (Bear Stearns successor)",
        },
    },

    # ===== OWNERSHIP =====

    # Wexner -> Nine East 71st (gifted to Epstein)
    {
        "type": "OWNERSHIP",
        "source": "leslie_wexner",
        "target_loc": "nine_east_71st",
        "props": {
            "stake": "former owner",
            "date": "1989",
            "description": "Gifted $77M mansion to Epstein",
        },
    },
    # Epstein properties
    {
        "type": "OWNERSHIP",
        "source": "jeffrey_epstein",
        "target_loc": "nine_east_71st",
        "props": {
            "stake": "100%",
            "date": "1996-2019",
            "description": "Manhattan mansion. Received from Wexner.",
        },
    },
    {
        "type": "OWNERSHIP",
        "source": "jeffrey_epstein",
        "target_loc": "little_st_james",
        "props": {
            "stake": "100%",
            "date": "1998-2019",
            "description": "Private island, US Virgin Islands",
        },
    },
    {
        "type": "OWNERSHIP",
        "source": "jeffrey_epstein",
        "target_loc": "great_st_james",
        "props": {
            "stake": "100%",
            "date": "2016-2019",
            "description": "Second USVI island",
        },
    },
    {
        "type": "OWNERSHIP",
        "source": "jeffrey_epstein",
        "target_loc": "avenue_foch",
        "props": {
            "stake": "100%",
            "date": "2000s-2019",
            "description": "Paris apartment, 16th arrondissement",
        },
    },
    {
        "type": "OWNERSHIP",
        "source": "jeffrey_epstein",
        "target_loc": "el_brillo_way",
        "props": {
            "stake": "100%",
            "date": "1990-2019",
            "description": "Palm Beach mansion",
        },
    },
    {
        "type": "OWNERSHIP",
        "source": "jeffrey_epstein",
        "target_org": "southern_trust_company",
        "props": {
            "stake": "100%",
            "date": "2000s",
            "description": "Primary financial vehicle",
        },
    },
    # Epstein -> Next Models ownership
    {
        "type": "OWNERSHIP",
        "source": "jeffrey_epstein",
        "target_org": "next_models",
        "props": {
            "stake": "50%",
            "date": "2004",
            "description": "Brunel had 50% ownership through Epstein",
        },
    },
    # Wexner -> L Brands
    {
        "type": "OWNERSHIP",
        "source": "leslie_wexner",
        "target_org": "l_brands",
        "props": {
            "stake": "majority",
            "date": "1963-2020",
            "description": "Founded and controlled L Brands / The Limited",
        },
    },
    # L Brands -> Victoria's Secret
    {
        "type": "OWNERSHIP",
        "source_org": "l_brands",
        "target_org": "victorias_secret",
        "props": {
            "stake": "100%",
            "date": "1982-2021",
            "description": "L Brands subsidiary",
        },
    },
]
