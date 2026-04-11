/**
 * Victorian Aboriginal language groups, clans, and communities.
 *
 * Sources: AIATSIS AUSTLANG; First Peoples – State Relations (Victorian Government);
 * Registered Aboriginal Party determinations; community language centres.
 *
 * Spellings follow contemporary community-preferred forms where known.
 * Alternate names are included for search accessibility only — they are not
 * necessarily equivalent or interchangeable with the primary name.
 *
 * Note on skin names: The section/skin name system (e.g. Japanangka, Japangardi)
 * is a Central and Western Desert kinship tradition. Victorian Aboriginal peoples
 * organise kinship primarily through moiety (Bunjil/Waa for Kulin peoples) and
 * clan affiliation — not through skin names. This field is intentionally absent
 * for Victorian groups.
 */

export interface MobGroup {
  id: string;
  name: string;
  alternateNames?: string[];
  stateTerritory: string;
  type: 'language_group' | 'clan' | 'community' | 'nation';
  description?: string;
  /** Region ID from regions.ts that this clan belongs to, if applicable */
  nationId?: string;
}

export const mobGroups: MobGroup[] = [

  // ── Kulin Nation ──────────────────────────────────────────────────────────
  // Five language groups of central and southern Victoria sharing the
  // Bunjil (Eaglehawk) / Waa (Crow) moiety system and a tradition of alliance.

  {
    id: 'wurundjeri',
    name: 'Wurundjeri Woi Wurrung',
    alternateNames: ['Woiwurrung', 'Wurundjeri', 'Birrarung people'],
    stateTerritory: 'Victoria',
    type: 'language_group',
    description: 'Traditional custodians of Melbourne (Naarm) and the Birrarung (Yarra River). Kulin Nation.',
  },
  {
    id: 'boonwurrung',
    name: 'Boon Wurrung',
    alternateNames: ['Bunurong', 'Boonwurrung'],
    stateTerritory: 'Victoria',
    type: 'language_group',
    description: 'Saltwater Kulin people. Custodians of Port Phillip Bay east, the Mornington Peninsula, and Western Port.',
  },
  {
    id: 'wadawurrung',
    name: 'Wadawurrung',
    alternateNames: ['Wada Wurrung'],
    stateTerritory: 'Victoria',
    type: 'language_group',
    description: 'Kulin people of Djilang (Geelong), Ballarat, and the Surf Coast to Cape Otway.',
  },
  {
    id: 'dja_dja_wurrung',
    name: 'Dja Dja Wurrung',
    alternateNames: ['Jaara', 'Djadjawurrung'],
    stateTerritory: 'Victoria',
    type: 'language_group',
    description: 'Kulin people of the Loddon and Avoca River country around Bendigo and Castlemaine.',
  },
  {
    id: 'taungurung',
    name: 'Taungurung',
    alternateNames: ['Daung wurrung', 'Taungerong'],
    stateTerritory: 'Victoria',
    type: 'language_group',
    description: 'Mountain Kulin people. Country spans the upper Goulburn River, Great Dividing Range, and Eildon region.',
  },

  // ── Southwest Victoria ────────────────────────────────────────────────────

  {
    id: 'gunditjmara',
    name: 'Gunditjmara',
    alternateNames: ['Gunditjamara', 'Kirrae Wurrong', 'Peek Wurrong'],
    stateTerritory: 'Victoria',
    type: 'nation',
    description: 'Custodians of Budj Bim (Mount Eccles), Tae Rak (Lake Condah), and the southwest coast. Builders of a 6,600-year-old eel aquaculture system.',
  },
  {
    id: 'djab_wurrung',
    name: 'Djab wurrung',
    alternateNames: ['Djabwurrung', 'Eastern Maar'],
    stateTerritory: 'Victoria',
    type: 'language_group',
    description: 'Custodians of Gariwerd (the Grampians) and upper Wimmera River. Country is home to Bunjil\'s Shelter and significant Dreaming sites.',
  },
  {
    id: 'jardwadjali',
    name: 'Jardwadjali',
    alternateNames: ['Jaadwa', 'Jaradwadjali'],
    stateTerritory: 'Victoria',
    type: 'language_group',
    description: 'People of the western Grampians foothills and Wimmera River. Neighbours and allies of the Djab wurrung.',
  },

  // ── Northwest Victoria ────────────────────────────────────────────────────

  {
    id: 'wergaia',
    name: 'Wergaia',
    alternateNames: ['Wergaio', 'Wotjobaluk', 'Wudjaubaluk', 'Jupagalk'],
    stateTerritory: 'Victoria',
    type: 'language_group',
    description: 'People of the Mallee and Wimmera. Country includes Lake Hindmarsh, Lake Albacutya, and the lower Wimmera River.',
  },
  {
    id: 'latje_latje',
    name: 'Latje Latje',
    alternateNames: ['Latji Latji', 'Tati Tati'],
    stateTerritory: 'Victoria',
    type: 'language_group',
    description: 'Upper Murray River people around Swan Hill. Skilled in harvesting the river\'s seasonal resources.',
  },
  {
    id: 'wamba_wamba',
    name: 'Wamba Wamba',
    alternateNames: ['Wemba Wemba', 'Wembawemba'],
    stateTerritory: 'Victoria',
    type: 'language_group',
    description: 'People of the Murray-Loddon junction around Kerang. The Kerang lakes were major gathering places for ceremony and seasonal food.',
  },

  // ── Murray River ──────────────────────────────────────────────────────────

  {
    id: 'yorta_yorta',
    name: 'Yorta Yorta',
    alternateNames: ['Joti Joti', 'Yota Yota'],
    stateTerritory: 'Victoria',
    type: 'nation',
    description: 'River people of the Dungala (Murray) and the Barmah-Millewa Forest around Echuca — the world\'s largest river red gum forest.',
  },
  {
    id: 'barapa_barapa',
    name: 'Barapa Barapa',
    alternateNames: ['Baraba Baraba'],
    stateTerritory: 'Victoria',
    type: 'language_group',
    description: 'Murray River people of the Swan Hill and Kerang district, connected to the broader river nation networks.',
  },

  // ── Gippsland ────────────────────────────────────────────────────────────

  {
    id: 'gunaikurnai',
    name: 'Gunaikurnai',
    alternateNames: ['Gunai Kurnai', 'Gunnai', 'Kurnai'],
    stateTerritory: 'Victoria',
    type: 'nation',
    description: 'Five clan groups — Brataualung, Brayakaulung, Brabralung, Krauatungalung, and Tatungalung — across all of Gippsland.',
  },

  // ── High Country / Alps ───────────────────────────────────────────────────

  {
    id: 'monero_ngarigo',
    name: 'Monero Ngarigo',
    alternateNames: ['Ngarigo', 'Ngarego'],
    stateTerritory: 'Victoria',
    type: 'nation',
    description: 'Mountain peoples of the Victorian and NSW alps. The bogong moth harvest brought many nations together on the high plains each summer.',
  },
  {
    id: 'dhudhuroa',
    name: 'Dhudhuroa',
    alternateNames: ['Dudhuroa', 'Dhudhoroa'],
    stateTerritory: 'Victoria',
    type: 'language_group',
    description: 'People of the upper Murray, Mitta Mitta, and Kiewa Valleys in northeast Victoria.',
  },
  {
    id: 'jaitmathang',
    name: 'Jaitmathang',
    alternateNames: ['Jaimathang', 'Jeithi'],
    stateTerritory: 'Victoria',
    type: 'language_group',
    description: 'High plains people. Custodians of the Bogong High Plains — site of one of the largest inter-nation gatherings in southeast Australia.',
  },

  // ── Documented Victorian clans ────────────────────────────────────────────
  // These are specific clan groups within larger nations, where clan names
  // are publicly documented. Source: AIATSIS; Gunaikurnai Land and Waters
  // Aboriginal Corporation; First Peoples – State Relations (VIC).

  // Gunaikurnai — five documented clans of Gippsland
  {
    id: 'brataualung',
    name: 'Brataualung',
    alternateNames: ['Brataualung Clan'],
    stateTerritory: 'Victoria',
    type: 'clan',
    nationId: 'gunaikurnai',
    description: 'Southern Gippsland clan of the Gunaikurnai — Country around Yarram and the Ninety Mile Beach coast.',
  },
  {
    id: 'brayakaulung',
    name: 'Brayakaulung',
    stateTerritory: 'Victoria',
    type: 'clan',
    nationId: 'gunaikurnai',
    description: 'Eastern Gippsland clan of the Gunaikurnai — Country around Bairnsdale and the Mitchell River delta.',
  },
  {
    id: 'brabralung',
    name: 'Brabralung',
    stateTerritory: 'Victoria',
    type: 'clan',
    nationId: 'gunaikurnai',
    description: 'Central Gippsland clan of the Gunaikurnai — Country along the Mitchell and Avon Rivers.',
  },
  {
    id: 'krauatungalung',
    name: 'Krauatungalung',
    stateTerritory: 'Victoria',
    type: 'clan',
    nationId: 'gunaikurnai',
    description: 'Northern Gippsland clan of the Gunaikurnai — Country around the Latrobe Valley and Strzelecki Ranges.',
  },
  {
    id: 'tatungalung',
    name: 'Tatungalung',
    stateTerritory: 'Victoria',
    type: 'clan',
    nationId: 'gunaikurnai',
    description: 'Coastal clan of the Gunaikurnai — Country around Lake Wellington and the Gippsland Lakes.',
  },

  // Boon Wurrung — documented clan
  {
    id: 'yalukit_willam',
    name: 'Yalukit-willam',
    alternateNames: ['Yaluk-ut-weelam', 'Yalukit Willam'],
    stateTerritory: 'Victoria',
    type: 'clan',
    nationId: 'boonwurrung',
    description: 'Boon Wurrung clan of the bay. Country along Hobsons Bay, the Yarra mouth (Birrarung Marr), and the western Port Phillip shore.',
  },

  // Gunditjmara — two documented clan groups
  {
    id: 'kirrae_wurrong',
    name: 'Kirrae Wurrong',
    alternateNames: ['Kirrae Wuurong'],
    stateTerritory: 'Victoria',
    type: 'clan',
    nationId: 'gunditjmara',
    description: 'Inland Gunditjmara clan. Country spans the volcanic plains east of Camperdown and the Hopkins River headwaters.',
  },
  {
    id: 'peek_wurrong',
    name: 'Peek Wurrong',
    stateTerritory: 'Victoria',
    type: 'clan',
    nationId: 'gunditjmara',
    description: 'Coastal Gunditjmara clan. Country along the south-west coast from Warrnambool toward Portland.',
  },

  // ── Documented Victorian communities ─────────────────────────────────────
  // Historical reserves, missions, and contemporary Aboriginal communities.
  // Source: AIATSIS; Victorian Aboriginal community organisations.

  {
    id: 'framlingham',
    name: 'Framlingham',
    alternateNames: ['Framlingham Aboriginal Trust'],
    stateTerritory: 'Victoria',
    type: 'community',
    nationId: 'gunditjmara',
    description: 'Aboriginal community near Warrnambool on Gunditjmara country. One of two reserves not surrendered under the 1886 Aboriginal Protection Act.',
  },
  {
    id: 'lake_tyers',
    name: 'Lake Tyers / Bung Yarnda',
    alternateNames: ['Lake Tyers', 'Bung Yarnda', 'Lake Tyers Aboriginal Trust'],
    stateTerritory: 'Victoria',
    type: 'community',
    nationId: 'gunaikurnai',
    description: 'Aboriginal community on the Gunaikurnai coast near Lakes Entrance, East Gippsland.',
  },
  {
    id: 'cummeragunja',
    name: 'Cummeragunja',
    alternateNames: ['Cumeroogunga', 'Cumeragunja'],
    stateTerritory: 'Victoria',
    type: 'community',
    nationId: 'yorta_yorta',
    description: 'Yorta Yorta community on the Murray River. Site of the 1939 Cummeragunja Walk-Off — a landmark act of Aboriginal resistance and self-determination.',
  },
  {
    id: 'mooroopna',
    name: 'Rumbalara',
    alternateNames: ['Rumbalara Football Netball Club'],
    stateTerritory: 'Victoria',
    type: 'community',
    nationId: 'yorta_yorta',
    description: 'Yorta Yorta and Bangerang community in Mooroopna. Home of Rumbalara, one of Victoria\'s most prominent Aboriginal community organisations.',
  },
  {
    id: 'healesvillle_sanctuary',
    name: 'Coranderrk',
    alternateNames: ['Healesville', 'Coranderrk Station'],
    stateTerritory: 'Victoria',
    type: 'community',
    nationId: 'wurundjeri',
    description: 'Wurundjeri community station at Healesville. The 1886 Coranderrk Petition was one of the earliest successful Aboriginal civil rights campaigns in Australia.',
  },

  // ── Collective and pan-Victorian identity terms ───────────────────────────

  {
    id: 'koorie',
    name: 'Koorie',
    alternateNames: ['Koori'],
    stateTerritory: 'Victoria',
    type: 'community',
    description: 'Collective term used by Aboriginal peoples of Victoria and NSW. A shared identity — not a language group.',
  },
  {
    id: 'urban_koorie',
    name: 'Urban Koorie',
    stateTerritory: 'Victoria',
    type: 'community',
    description: 'Identity for Aboriginal Victorians living in cities, particularly Melbourne (Naarm). Strong community networks through Koorie organisations.',
  },
];
