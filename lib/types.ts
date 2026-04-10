export type Visibility = 'public' | 'family' | 'restricted' | 'gendered';

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

export type StoryType = 'audio' | 'photo' | 'text' | 'video';

export type KinshipTemplateType =
  | 'moiety_only'
  | 'four_section'
  | 'eight_subsection'
  | 'gendered_subsection'
  | 'torres_strait_clan';

export interface Story {
  id: string;
  title: string;
  type: StoryType;
  content: string; // text body or base64 data URL for photos
  recordedBy: string;
  recordedDate: string;
  seasonTag: string; // season id or 'unsure'
  seasonalContext?: string;
  placeConnection?: string;
  visibility: Visibility;
  linkedPersonIds: string[];
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
  countryLanguageGroup?: string;
  regionSelectorValue: string;
  isDeceased: boolean;
  stories: Story[];
  visibility: Visibility;
  lastUpdated: string; // ISO date
  position: { x: number; y: number };
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
  | { type: 'DELETE_STORY'; payload: { personId: string; storyId: string } };
