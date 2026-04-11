import type { Region } from '../types';

// Sources: AIATSIS AUSTLANG database; First Peoples – State Relations (Victorian Government);
// Registered Aboriginal Party determinations; community language centres.
// Spellings follow contemporary community-preferred forms where known.
// All entries are Victorian. calendarId uses 'generic' — a Victorian seasonal calendar
// is not yet implemented; seasonal knowledge belongs to communities.

export const regions: Region[] = [

  // ── Kulin Nation — central and southern Victoria ──────────────────────────
  // The five Kulin language groups share the Bunjil / Waa moiety system
  // and a long tradition of alliance, trade and ceremony.

  {
    id: 'wurundjeri',
    displayName: 'Wurundjeri Woi Wurrung',
    alternateNames: ['Woiwurrung', 'Wurundjeri', 'Birrarung people'],
    stateTerritory: 'Victoria',
    countryDescription: 'Melbourne (Naarm), Birrarung (Yarra River), and the surrounding ranges.',
    description:
      'Traditional custodians of Melbourne and the Birrarung (Yarra River). ' +
      'Bunjil/Waa moiety system. The Birrarung is the spiritual and cultural heartline of Wurundjeri Country.',
    calendarId: 'generic',
    kinshipTemplateType: 'kulin_nation',
  },
  {
    id: 'boonwurrung',
    displayName: 'Boon Wurrung',
    alternateNames: ['Bunurong', 'Boonwurrung', 'Bunerong', 'Boon wurrung'],
    stateTerritory: 'Victoria',
    countryDescription: 'Port Phillip Bay eastern shore, Mornington Peninsula, and Western Port (Boon Wurrung Sea Country).',
    description:
      'Saltwater Kulin people. Custodians from the Werribee River south to Wilsons Promontory (Wamoon) and the Bass Strait islands. ' +
      'Deep connections to whale, seal, and bay Country. Bunjil/Waa moiety system.',
    calendarId: 'generic',
    kinshipTemplateType: 'kulin_nation',
  },
  {
    id: 'wadawurrung',
    displayName: 'Wadawurrung',
    alternateNames: ['Wada Wurrung', 'Wathauroong'],
    stateTerritory: 'Victoria',
    countryDescription: 'Geelong, Ballarat, Surf Coast, and the Otway Ranges.',
    description:
      'Kulin people of the western Port Phillip coast and Otways. Country spans from the Werribee River to Cape Otway. ' +
      'Custodians of Djilang (Geelong) and the Moorabool River. Bunjil/Waa moiety system.',
    calendarId: 'generic',
    kinshipTemplateType: 'kulin_nation',
  },
  {
    id: 'dja_dja_wurrung',
    displayName: 'Dja Dja Wurrung',
    alternateNames: ['Jaara', 'Djadjawurrung'],
    stateTerritory: 'Victoria',
    countryDescription: 'Central Victoria — Bendigo, Castlemaine, and the Loddon River valley.',
    description:
      'Kulin people of the Loddon and Avoca River country. ' +
      'The first Victorian Nation to have a Registered Aboriginal Party under the Aboriginal Heritage Act. Bunjil/Waa moiety system.',
    calendarId: 'generic',
    kinshipTemplateType: 'kulin_nation',
  },
  {
    id: 'taungurung',
    displayName: 'Taungurung',
    alternateNames: ['Daung wurrung', 'Taungerong', 'Daungwurrung'],
    stateTerritory: 'Victoria',
    countryDescription: 'Central Victoria — upper Yarra, Goulburn River, and ranges north to Mansfield and Eildon.',
    description:
      'Mountain Kulin people of the Great Dividing Range and upper Goulburn River. ' +
      'Country includes the Eildon and Mansfield regions. Custodians of significant alpine and river Country. Bunjil/Waa moiety system.',
    calendarId: 'generic',
    kinshipTemplateType: 'kulin_nation',
  },

  // ── Southwest Victoria ────────────────────────────────────────────────────

  {
    id: 'gunditjmara',
    displayName: 'Gunditjmara',
    alternateNames: ['Gunditjamara', 'Kirrae Wurrong', 'Peek Wurrong'],
    stateTerritory: 'Victoria',
    countryDescription: 'South-west Victoria — Tae Rak (Lake Condah), Portland (Tyrendarra), and Budj Bim (Mount Eccles).',
    description:
      'Builders of the Budj Bim eel aquaculture system — a UNESCO World Heritage site ' +
      'and one of the world\'s oldest engineering works, more than 6,600 years old.',
    calendarId: 'generic',
    kinshipTemplateType: 'moiety_only',
  },
  {
    id: 'djab_wurrung',
    displayName: 'Djab wurrung',
    alternateNames: ['Djabwurrung', 'Eastern Maar'],
    stateTerritory: 'Victoria',
    countryDescription: 'Gariwerd (the Grampians), the Pyrenees, and upper Wimmera River.',
    description:
      'Custodians of Gariwerd (the Grampians). Rich rock art tradition at Bunjil\'s Shelter and across the ranges. ' +
      'Country is home to significant Dreaming sites connected to Bunjil, creator spirit.',
    calendarId: 'generic',
    kinshipTemplateType: 'moiety_only',
  },
  {
    id: 'jardwadjali',
    displayName: 'Jardwadjali',
    alternateNames: ['Jaadwa', 'Jaradwadjali'],
    stateTerritory: 'Victoria',
    countryDescription: 'Western Wimmera and the western Grampians foothills.',
    description:
      'Western neighbours of the Djab wurrung. Country spans the western Grampians foothills ' +
      'and the Wimmera River. Shared ceremonial connections across the wider Grampians region.',
    calendarId: 'generic',
    kinshipTemplateType: 'moiety_only',
  },

  // ── Northwest Victoria ────────────────────────────────────────────────────

  {
    id: 'wergaia',
    displayName: 'Wergaia',
    alternateNames: ['Wergaio', 'Wotjobaluk', 'Wudjaubaluk', 'Jupagalk'],
    stateTerritory: 'Victoria',
    countryDescription: 'Northwest Victoria — Mallee, Horsham, and the Wimmera-Mallee wetlands.',
    description:
      'People of the Mallee and Wimmera. Country includes Lake Hindmarsh, Lake Albacutya, ' +
      'and the lower Wimmera River. The Wergaia language encompasses several related clan groups.',
    calendarId: 'generic',
    kinshipTemplateType: 'moiety_only',
  },
  {
    id: 'latje_latje',
    displayName: 'Latje Latje',
    alternateNames: ['Latji Latji', 'Tati Tati'],
    stateTerritory: 'Victoria',
    countryDescription: 'Upper Murray River around Swan Hill and Mildura.',
    description:
      'Murray River peoples of the upper reaches. Skilled in harvesting the river\'s seasonal abundance — ' +
      'fish, waterbirds, and floodplain plants. Connected to the broader Murray River trading networks.',
    calendarId: 'generic',
    kinshipTemplateType: 'moiety_only',
  },
  {
    id: 'wamba_wamba',
    displayName: 'Wamba Wamba',
    alternateNames: ['Wemba Wemba', 'Wembawemba'],
    stateTerritory: 'Victoria',
    countryDescription: 'Murray Valley around Kerang and the Loddon-Murray junction.',
    description:
      'People of the Murray-Loddon junction. Rich connections to wetland and waterbird Country. ' +
      'The Kerang lakes and reed beds were major gathering places for ceremony and food.',
    calendarId: 'generic',
    kinshipTemplateType: 'moiety_only',
  },

  // ── Murray River ─────────────────────────────────────────────────────────

  {
    id: 'yorta_yorta',
    displayName: 'Yorta Yorta',
    alternateNames: ['Joti Joti', 'Yota Yota'],
    stateTerritory: 'Victoria',
    countryDescription: 'Dungala (Murray River) and Barmah-Millewa Forest around Echuca.',
    description:
      'River people of the Dungala (Murray) and the Barmah-Millewa Forest — the world\'s largest river red gum forest. ' +
      'Led a landmark High Court Native Title case in 2002.',
    calendarId: 'generic',
    kinshipTemplateType: 'moiety_only',
  },

  // ── Gippsland ────────────────────────────────────────────────────────────

  {
    id: 'gunaikurnai',
    displayName: 'Gunaikurnai',
    alternateNames: ['Gunai Kurnai', 'Gunnai', 'Kurnai'],
    stateTerritory: 'Victoria',
    countryDescription: 'Gippsland — east Victoria from Wonthaggi to the NSW border.',
    description:
      'Five clan groups sharing connected Country across Gippsland: Brataualung, Brayakaulung, Brabralung, ' +
      'Krauatungalung, and Tatungalung. Custodians of the Latrobe Valley, Mitchell River, and the Gippsland Lakes.',
    calendarId: 'generic',
    kinshipTemplateType: 'moiety_only',
  },

  // ── High Country / Alps ───────────────────────────────────────────────────

  {
    id: 'monero_ngarigo',
    displayName: 'Monero Ngarigo',
    alternateNames: ['Ngarigo', 'Ngarego', 'Ngariego'],
    stateTerritory: 'Victoria',
    countryDescription: 'Alpine Victorian high plains and upper Snowy River — shared with NSW.',
    description:
      'Mountain peoples of the Victorian and NSW alps. Seasonal Country reaching to the coast and plains for ceremony and trade. ' +
      'The bogong moth harvest brought nations together on the high plains each summer.',
    calendarId: 'generic',
    kinshipTemplateType: 'moiety_only',
  },
  {
    id: 'dhudhuroa',
    displayName: 'Dhudhuroa',
    alternateNames: ['Dudhuroa', 'Dhudhoroa'],
    stateTerritory: 'Victoria',
    countryDescription: 'Northeast Victoria — upper Murray River, Mitta Mitta and Kiewa Valleys.',
    description:
      'Alpine and valley people of northeast Victoria. Country follows the rivers and ranges ' +
      'from the upper Murray into the high country, connected to seasonal rounds across the mountains.',
    calendarId: 'generic',
    kinshipTemplateType: 'moiety_only',
  },
  {
    id: 'jaitmathang',
    displayName: 'Jaitmathang',
    alternateNames: ['Jaimathang', 'Jeithi'],
    stateTerritory: 'Victoria',
    countryDescription: 'Bogong High Plains — northeast Victoria around Mount Bogong and the Dargo High Plains.',
    description:
      'High plains people who hosted the annual bogong moth harvest on the Bogong High Plains. ' +
      'This was one of the largest inter-nation gatherings in southeast Australia — a time of feasting, ceremony, and trade.',
    calendarId: 'generic',
    kinshipTemplateType: 'moiety_only',
  },

  // ── Fallback ──────────────────────────────────────────────────────────────
  {
    id: 'not_listed',
    displayName: "My group isn't listed",
    alternateNames: ['not sure', 'unsure', 'unknown'],
    stateTerritory: '',
    countryDescription: '',
    description:
      "That's okay. You can start with a general framework and update your Country at any time.",
    calendarId: 'generic',
    kinshipTemplateType: 'moiety_only',
  },
];
