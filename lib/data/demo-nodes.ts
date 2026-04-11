import type { Person, Relationship } from '../types';

export const DEMO_PERSONS: Person[] = [
  {
    id: 'demo-1',
    displayName: 'Aunty June',
    skinName: 'Nangala',
    moiety: 'Sun side',
    regionSelectorValue: 'warlpiri',
    isDeceased: false,
    stories: [
      {
        id: 'demo-story-1',
        title: 'The Seven Sisters',
        type: 'text',
        content: 'Aunty June shares the Dreaming story of the Seven Sisters as told to her by her grandmother.',
        recordedBy: 'Aunty June',
        recordedDate: '2024-06-01',
        seasonTag: 'unsure',
        visibility: 'public',
        linkedPersonIds: [],
      },
    ],
    visibility: 'public',
    lastUpdated: new Date().toISOString(),
    position: { x: 700, y: 350 },
  },
  {
    id: 'demo-2',
    displayName: 'Uncle Ray',
    skinName: 'Japanangka',
    moiety: 'Sun side',
    regionSelectorValue: 'warlpiri',
    isDeceased: false,
    stories: [],
    visibility: 'public',
    lastUpdated: new Date().toISOString(),
    position: { x: 950, y: 300 },
  },
  {
    id: 'demo-3',
    displayName: 'Cousin Mia',
    skinName: 'Nungarrayi',
    moiety: 'Shade side',
    regionSelectorValue: 'warlpiri',
    isDeceased: false,
    stories: [],
    visibility: 'public',
    lastUpdated: new Date().toISOString(),
    position: { x: 820, y: 520 },
  },
];

export const DEMO_RELATIONSHIPS: Relationship[] = [
  {
    id: 'demo-rel-1',
    fromPersonId: 'demo-1',
    toPersonId: 'demo-2',
    relationshipType: 'spouse',
    proximity: 'close',
    isAvoidance: false,
  },
  {
    id: 'demo-rel-2',
    fromPersonId: 'demo-1',
    toPersonId: 'demo-3',
    relationshipType: 'classificatory_mother',
    proximity: 'classificatory',
    isAvoidance: false,
  },
];
