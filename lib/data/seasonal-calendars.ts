import type { SeasonalCalendar } from '../types';

export const noongarCalendar: SeasonalCalendar = {
  templateId: 'noongar',
  regionName: 'Noongar Country',
  languageGroup: 'Noongar',
  cycleType: 'circular',
  sourceAttribution:
    'Noongar seasonal knowledge as shared by Noongar Elders. This calendar reflects the six seasons of the south-west of Western Australia.',
  seasons: [
    {
      id: 'birak',
      name: 'Birak',
      nameEnglish: 'First summer / Hot dry',
      approximateMonths: [12, 1],
      description:
        'The hot, dry time. Easterly winds bring warm days. Noongar people used fire to manage the land during Birak, burning undergrowth to encourage new growth and drive game.',
      celestialIndicators: ['Scorpius low in the western sky at dusk'],
      colorPalette: { bgFrom: '#1a0f05', bgTo: '#0d0a14', accentColor: '#d4a057' },
      cyclePosition: 0,
    },
    {
      id: 'bunuru',
      name: 'Bunuru',
      nameEnglish: 'Second summer / Hottest',
      approximateMonths: [2, 3],
      description:
        'The hottest time of year. Afternoon sea breezes provide relief. This is the time for fishing in rivers and estuaries, and for gathering seeds and bulbs.',
      celestialIndicators: ['Orion visible overhead in the evening'],
      colorPalette: { bgFrom: '#1f0d08', bgTo: '#0d0a14', accentColor: '#e8734a' },
      cyclePosition: 0.167,
    },
    {
      id: 'djeran',
      name: 'Djeran',
      nameEnglish: 'Autumn / Cooling',
      approximateMonths: [4, 5],
      description:
        'The break of season. Cooler nights and mornings signal change. Red-tailed black cockatoos are seen and heard. Banksias are in flower, providing food for birds and bees.',
      celestialIndicators: ['The Emu in the Sky stretches across the Milky Way'],
      colorPalette: { bgFrom: '#14100a', bgTo: '#0a0814', accentColor: '#c4a35a' },
      cyclePosition: 0.333,
    },
    {
      id: 'makuru',
      name: 'Makuru',
      nameEnglish: 'Winter / Cold and wet',
      approximateMonths: [6, 7],
      description:
        'The coldest and wettest time. Rivers and creeks are flowing. This is the time of fertility — frogs call, waterbirds nest. Noongar people moved to higher ground and sheltered camps.',
      celestialIndicators: ['Southern Cross high in the sky', 'Emu in the Sky visible in full'],
      colorPalette: { bgFrom: '#080a1a', bgTo: '#05061a', accentColor: '#6b7fb8' },
      cyclePosition: 0.5,
    },
    {
      id: 'djilba',
      name: 'Djilba',
      nameEnglish: 'Late winter–spring / Transitional',
      approximateMonths: [8, 9],
      description:
        'A transitional season of cold, wet days mixed with clear, warmer days. Many wildflowers begin to bloom. Baby animals are born. The land is regenerating.',
      celestialIndicators: ['Pleiades (Seven Sisters) rising before dawn'],
      colorPalette: { bgFrom: '#0a0d14', bgTo: '#080a18', accentColor: '#8ba4b8' },
      cyclePosition: 0.667,
    },
    {
      id: 'kambarang',
      name: 'Kambarang',
      nameEnglish: 'Spring / Wildflower season',
      approximateMonths: [10, 11],
      description:
        'Wildflower season. The land explodes with colour. Reptiles are active again. Birds are nesting. This is a time of abundance and ceremony.',
      celestialIndicators: ['Scorpius rising in the east before dawn', 'Pleiades visible at dusk'],
      colorPalette: { bgFrom: '#0d1208', bgTo: '#080a14', accentColor: '#8db86b' },
      cyclePosition: 0.833,
    },
  ],
};

export const yolnguCalendar: SeasonalCalendar = {
  templateId: 'yolngu',
  regionName: 'Arnhem Land',
  languageGroup: 'Yolngu Matha',
  cycleType: 'circular',
  sourceAttribution:
    'Yolngu seasonal knowledge from Arnhem Land, Northern Territory. Seasons follow the monsoon cycle.',
  seasons: [
    {
      id: 'dharratharramirri',
      name: 'Dharratharramirri',
      nameEnglish: 'Pre-wet / Buildup',
      approximateMonths: [10, 11],
      description:
        'The buildup before the monsoon. Hot, humid days with dramatic thunderstorms. The land is dry and waiting. Lightning fires clear the country.',
      celestialIndicators: ['Morning Star (Barnumbirr/Venus) ceremonies'],
      colorPalette: { bgFrom: '#1a1008', bgTo: '#0d0a14', accentColor: '#c9a04e' },
      cyclePosition: 0,
    },
    {
      id: 'barramirri',
      name: "Barra'mirri",
      nameEnglish: 'Wet season / Monsoon',
      approximateMonths: [12, 1, 2],
      description:
        'The monsoon arrives. Heavy rains flood the country, filling billabongs and rivers. This is a time of staying in sheltered camps, sharing stories and ceremony.',
      celestialIndicators: ['Scorpius hidden by monsoon clouds'],
      colorPalette: { bgFrom: '#081418', bgTo: '#060a14', accentColor: '#4a8a8a' },
      cyclePosition: 0.2,
    },
    {
      id: 'mainmak',
      name: 'Mainmak',
      nameEnglish: 'Post-wet / Knock-em-down storm season',
      approximateMonths: [3, 4],
      description:
        'The rains ease. Strong winds flatten the spear grass. The floodwaters recede, leaving lush green growth. Fish are trapped in shrinking billabongs.',
      colorPalette: { bgFrom: '#081408', bgTo: '#080a14', accentColor: '#5aaa5a' },
      cyclePosition: 0.4,
    },
    {
      id: 'midawarr',
      name: 'Midawarr',
      nameEnglish: 'Mid-dry / Harvest',
      approximateMonths: [5, 6, 7],
      description:
        'The harvest season. Fruits, yams, and cycad nuts are gathered. The weather is mild and dry. This is a time of travel, trade, and large ceremonies.',
      celestialIndicators: ['Emu in the Sky prominent', 'Scorpius rising in the east'],
      colorPalette: { bgFrom: '#141008', bgTo: '#0a0814', accentColor: '#d4a840' },
      cyclePosition: 0.6,
    },
    {
      id: 'dharratharr',
      name: 'Dharratharr',
      nameEnglish: 'Late dry',
      approximateMonths: [8, 9],
      description:
        'The land dries out. Fire is used to manage the bush. Smoke haze fills the sky. Animals concentrate around remaining water sources.',
      colorPalette: { bgFrom: '#18100a', bgTo: '#0d0814', accentColor: '#b87a40' },
      cyclePosition: 0.8,
    },
  ],
};

export const dharawalCalendar: SeasonalCalendar = {
  templateId: 'dharawal',
  regionName: 'Sydney Basin',
  languageGroup: "D'harawal",
  cycleType: 'circular',
  sourceAttribution:
    "D'harawal seasonal knowledge from the Sydney basin, NSW. Based on the work of Aunty Fran Bodkin.",
  seasons: [
    {
      id: 'ngoonungi',
      name: 'Ngoonungi',
      nameEnglish: 'Cool becoming cold',
      approximateMonths: [4, 5],
      description:
        'Lyrebirds are singing and building nesting mounds. Bandicoots are searching for mates. The Lilly Pilly fruits are ripening.',
      celestialIndicators: ['Emu in the Sky visible in full across the Milky Way'],
      colorPalette: { bgFrom: '#0d100a', bgTo: '#080a14', accentColor: '#8aaa6b' },
      cyclePosition: 0,
    },
    {
      id: 'wiritjiribin',
      name: 'Wiritjiribin',
      nameEnglish: 'Cold, short days',
      approximateMonths: [6, 7],
      description:
        'The coldest season. Whales migrate north along the coast. Wattle begins to bloom. Time to stay close to camp and share stories.',
      celestialIndicators: ['Southern Cross at its highest point'],
      colorPalette: { bgFrom: '#080a1a', bgTo: '#060818', accentColor: '#6878aa' },
      cyclePosition: 0.167,
    },
    {
      id: 'tumburung',
      name: 'Tumburung',
      nameEnglish: 'Cold becoming warm',
      approximateMonths: [8, 9],
      description:
        'Wattles in full bloom. Echidnas are looking for mates. Whales are returning south with calves. Wildflowers appear across the sandstone.',
      colorPalette: { bgFrom: '#0a0d14', bgTo: '#080a16', accentColor: '#a08a5a' },
      cyclePosition: 0.333,
    },
    {
      id: 'marrai_gang',
      name: "Marrai'gang",
      nameEnglish: 'Warm and wet',
      approximateMonths: [10, 11],
      description:
        'Warm weather brings rain and thunderstorms. Mosquitoes swarm. Flying foxes gather in camps. Cicadas begin to sing.',
      celestialIndicators: ['Scorpius visible in the evening sky'],
      colorPalette: { bgFrom: '#0d1208', bgTo: '#080a14', accentColor: '#7ab86a' },
      cyclePosition: 0.5,
    },
    {
      id: 'gadalung_marool',
      name: 'Gadalung Marool',
      nameEnglish: 'Hot and dry',
      approximateMonths: [12, 1],
      description:
        'The hottest time. Cicadas are at full chorus. Christmas Bells and Waratahs bloom. Sharks move closer to shore following fish.',
      colorPalette: { bgFrom: '#1a0f05', bgTo: '#0d0a14', accentColor: '#d4a057' },
      cyclePosition: 0.667,
    },
    {
      id: 'burran',
      name: 'Burran',
      nameEnglish: 'Hot becoming cool',
      approximateMonths: [2, 3],
      description:
        'Temperatures ease. Fig trees fruit. Mullet and flathead are abundant. Flying foxes begin to disperse from camps.',
      colorPalette: { bgFrom: '#14100a', bgTo: '#0a0814', accentColor: '#c4945a' },
      cyclePosition: 0.833,
    },
  ],
};

export const torresStraitCalendar: SeasonalCalendar = {
  templateId: 'torres_strait',
  regionName: 'Torres Strait Islands',
  languageGroup: 'Torres Strait Islander',
  cycleType: 'circular',
  sourceAttribution:
    'Torres Strait Islander seasonal knowledge tied to monsoon and trade wind patterns across the Torres Strait Islands.',
  seasons: [
    {
      id: 'kuki',
      name: 'Kuki',
      nameEnglish: 'NW monsoon season',
      approximateMonths: [12, 1, 2, 3],
      description:
        'The northwest monsoon brings heavy rain, rough seas, and high humidity. Gardens are planted. Turtle and dugong hunting is limited. Community stays close to the islands.',
      celestialIndicators: ['Tagai (fisherman constellation) guides seasonal fishing'],
      colorPalette: { bgFrom: '#081420', bgTo: '#060a18', accentColor: '#4a7aaa' },
      cyclePosition: 0,
    },
    {
      id: 'sager',
      name: 'Sager',
      nameEnglish: 'SE trade wind season',
      approximateMonths: [5, 6, 7, 8, 9, 10],
      description:
        'The southeast trade winds bring clear skies and calm seas. This is the main season for fishing, turtle and dugong hunting, and inter-island travel. Gardens are harvested.',
      celestialIndicators: ['Tagai constellation prominent in the night sky'],
      colorPalette: { bgFrom: '#081418', bgTo: '#060a14', accentColor: '#4ab8a8' },
      cyclePosition: 0.5,
    },
    {
      id: 'naigai',
      name: 'Naigai',
      nameEnglish: 'Transitional period',
      approximateMonths: [4, 11],
      description:
        'The changeover between monsoon and trade winds. Winds are variable and unpredictable. Seas can be calm or sudden storms arise. A time of preparation.',
      colorPalette: { bgFrom: '#0d1014', bgTo: '#080a14', accentColor: '#8a9aaa' },
      cyclePosition: 0.25,
    },
  ],
};

export const genericCalendar: SeasonalCalendar = {
  templateId: 'generic',
  regionName: 'General',
  languageGroup: 'Not specified',
  cycleType: 'circular',
  sourceAttribution:
    'A simplified four-season framework for users who are still learning about their community\'s seasonal knowledge. You can switch to a specific calendar at any time.',
  seasons: [
    {
      id: 'warm_dry',
      name: 'Warm-Dry Season',
      nameEnglish: 'Warm and dry',
      approximateMonths: [12, 1, 2],
      description: 'The warm, dry period. Long days and clear skies.',
      colorPalette: { bgFrom: '#1a0f05', bgTo: '#0d0a14', accentColor: '#d4a057' },
      cyclePosition: 0,
    },
    {
      id: 'wet_cool',
      name: 'Wet-Cool Season',
      nameEnglish: 'Cool and wet',
      approximateMonths: [6, 7, 8],
      description: 'The cool, wet period. Shorter days and rainfall.',
      colorPalette: { bgFrom: '#080a1a', bgTo: '#060818', accentColor: '#6b7fb8' },
      cyclePosition: 0.5,
    },
    {
      id: 'transition_autumn',
      name: 'Cooling Season',
      nameEnglish: 'Cooling transition',
      approximateMonths: [3, 4, 5],
      description: 'The land cools. A time of transition and preparation.',
      colorPalette: { bgFrom: '#14100a', bgTo: '#0a0814', accentColor: '#c4a35a' },
      cyclePosition: 0.25,
    },
    {
      id: 'transition_spring',
      name: 'Warming Season',
      nameEnglish: 'Warming transition',
      approximateMonths: [9, 10, 11],
      description: 'The land warms again. New growth and renewal.',
      colorPalette: { bgFrom: '#0d1208', bgTo: '#080a14', accentColor: '#8db86b' },
      cyclePosition: 0.75,
    },
  ],
};

export const allCalendars: Record<string, SeasonalCalendar> = {
  noongar: noongarCalendar,
  yolngu: yolnguCalendar,
  dharawal: dharawalCalendar,
  torres_strait: torresStraitCalendar,
  generic: genericCalendar,
};
