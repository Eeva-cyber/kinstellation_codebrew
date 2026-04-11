export type Visibility = 'public' | 'family' | 'restricted' | 'gendered';

// ── Media entry types ────────────────────────────────────────────────────────

export interface JournalEntry {
  id: string;
  type: 'journal';
  title: string;
  text: string;
  date: string;                  // YYYY-MM-DD
  seasonTag: string;             // season id or 'unsure'
  useIndigenousCalendar: boolean;
  createdAt: string;
}

export interface PhotoEntry {
  id: string;
  type: 'photo';
  caption: string;
  imageData: string;             // base64 data URL
  date: string;
  seasonTag: string;
  useIndigenousCalendar: boolean;
  createdAt: string;
}

export interface ArticleEntry {
  id: string;
  type: 'article';
  title: string;
  url: string;
  note: string;
  createdAt: string;
}

export interface VideoEntry {
  id: string;
  type: 'video';
  title: string;
  url: string;
  note: string;
  createdAt: string;
}

export type MediaEntry = JournalEntry | PhotoEntry | ArticleEntry | VideoEntry;

export type RelationshipType =
  | 'mother'
  | 'father'
  | 'sibling'
  | 'spouse'
  | 'child'
  | 'classificatory_mother'
  | 'classificatory_father'
  | 'classificatory_sibling'
  | 'avoidance'
  | 'totemic'
  | 'country_connection'
  | 'kupai_omasker';

export type StoryType = 'audio' | 'photo' | 'text' | 'video' | 'file';

export type KinshipTemplateType =
  | 'moiety_only'
  | 'kulin_nation'
  | 'warlpiri'
  | 'yorta_yorta'
  | 'wergaia'
  | 'gunditjmara';

export interface Story {
  id: string;
  title: string;
  type: StoryType;
  content: string; // text body or base64 data URL for photos
  recordedBy: string;
  recordedDate: string;
  seasonTag: string; // season id or 'unsure'
  year?: number; // optional year for chronological ordering
  seasonalContext?: string;
  placeConnection?: string;
  visibility: Visibility;
  linkedPersonIds: string[];
  impactScore?: number; // 1–10, scored by AI; higher = draws closer to person star
}

export interface Person {
  id: string;
  displayName: string;
  indigenousName?: string;
  skinName?: string;
  skinNameGenderedPrefix?: string;
  moiety?: string;
  totemPersonal?: string;
  totemFamily?: string;
  totemClan?: string;
  totemNation?: string;
  mob?: string;
  nation?: string;
  clan?: string;
  community?: string;
  countryLanguageGroup?: string;
  regionSelectorValue: string;
  isDeceased: boolean;
  stories: Story[];
  mediaEntries?: MediaEntry[];
  visibility: Visibility;
  lastUpdated: string; // ISO date
  position: { x: number; y: number };
  isGuest?: boolean;
}

export interface Relationship {
  id: string;
  fromPersonId: string;
  toPersonId: string;
  relationshipType: RelationshipType;
  proximity: 'close' | 'classificatory';
  isAvoidance: boolean;
  notes?: string;
}

export interface SeasonColorPalette {
  bgFrom: string;
  bgTo: string;
  accentColor: string;
}

export interface Season {
  id: string;
  name: string;
  nameEnglish: string;
  approximateMonths: number[]; // 1-12
  description: string;
  celestialIndicators?: string[];
  colorPalette: SeasonColorPalette;
  cyclePosition: number; // 0-1 position in cycle
}

export interface SeasonalCalendar {
  templateId: string;
  regionName: string;
  languageGroup: string;
  seasons: Season[];
  cycleType: 'circular' | 'linear';
  sourceAttribution: string;
}

export interface KinshipTemplate {
  templateType: KinshipTemplateType;
  moietyNames?: [string, string];
  sectionNames?: string[];
  genderedPrefixes?: { male: string; female: string };
  description: string;
}

export interface Region {
  id: string;
  displayName: string;
  alternateNames?: string[]; // other spellings or clan names used in search
  stateTerritory: string;    // e.g. 'Western Australia', 'Northern Territory'
  countryDescription: string; // brief description of traditional Country
  description: string;
  calendarId: string;
  kinshipTemplateType: KinshipTemplateType;
}

export interface AppState {
  persons: Person[];
  relationships: Relationship[];
  selectedRegion: string | null;
  kinshipTemplate: KinshipTemplate | null;
  seasonalCalendar: SeasonalCalendar | null;
  currentSeasonId: string | null;
  initialized: boolean;
}

export type AppAction =
  | { type: 'INIT'; payload: AppState }
  | { type: 'SET_REGION'; payload: { regionId: string; kinshipTemplate: KinshipTemplate; seasonalCalendar: SeasonalCalendar; currentSeasonId: string | null } }
  | { type: 'ADD_PERSON'; payload: Person }
  | { type: 'UPDATE_PERSON'; payload: Person }
  | { type: 'DELETE_PERSON'; payload: string }
  | { type: 'ADD_RELATIONSHIP'; payload: Relationship }
  | { type: 'DELETE_RELATIONSHIP'; payload: string }
  | { type: 'ADD_STORY'; payload: { personId: string; story: Story } }
  | { type: 'UPDATE_STORY'; payload: { personId: string; story: Story } }
  | { type: 'DELETE_STORY'; payload: { personId: string; storyId: string } }
  | { type: 'ADD_MEDIA_ENTRY'; payload: { personId: string; entry: MediaEntry } }
  | { type: 'DELETE_MEDIA_ENTRY'; payload: { personId: string; entryId: string } };
