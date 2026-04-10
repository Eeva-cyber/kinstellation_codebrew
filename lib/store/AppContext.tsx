'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import type { AppState, AppAction, Person, Story, Relationship } from '../types';
import { allCalendars } from '../data/seasonal-calendars';
import { kinshipTemplates } from '../data/kinship-templates';
import { regions } from '../data/regions';
import { getCurrentSeason } from '../utils/season';
import { supabase } from '../supabase';

const REGION_KEY = 'kinstellation_region';

const initialState: AppState = {
  persons: [],
  relationships: [],
  selectedRegion: null,
  kinshipTemplate: null,
  seasonalCalendar: null,
  currentSeasonId: null,
  initialized: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'INIT':
      return { ...action.payload, initialized: true };

    case 'SET_REGION':
      return {
        ...state,
        selectedRegion: action.payload.regionId,
        kinshipTemplate: action.payload.kinshipTemplate,
        seasonalCalendar: action.payload.seasonalCalendar,
        currentSeasonId: action.payload.currentSeasonId,
        initialized: true,
      };

    case 'ADD_PERSON':
      return { ...state, persons: [...state.persons, action.payload] };

    case 'UPDATE_PERSON':
      return {
        ...state,
        persons: state.persons.map((p) =>
          p.id === action.payload.id ? action.payload : p,
        ),
      };

    case 'DELETE_PERSON':
      return {
        ...state,
        persons: state.persons.filter((p) => p.id !== action.payload),
        relationships: state.relationships.filter(
          (r) =>
            r.fromPersonId !== action.payload &&
            r.toPersonId !== action.payload,
        ),
      };

    case 'ADD_RELATIONSHIP':
      return {
        ...state,
        relationships: [...state.relationships, action.payload],
      };

    case 'DELETE_RELATIONSHIP':
      return {
        ...state,
        relationships: state.relationships.filter(
          (r) => r.id !== action.payload,
        ),
      };

    case 'ADD_STORY':
      return {
        ...state,
        persons: state.persons.map((p) =>
          p.id === action.payload.personId
            ? {
                ...p,
                stories: [...p.stories, action.payload.story],
                lastUpdated: new Date().toISOString(),
              }
            : p,
        ),
      };

    case 'UPDATE_STORY':
      return {
        ...state,
        persons: state.persons.map((p) =>
          p.id === action.payload.personId
            ? {
                ...p,
                stories: p.stories.map((s) =>
                  s.id === action.payload.story.id ? action.payload.story : s,
                ),
                lastUpdated: new Date().toISOString(),
              }
            : p,
        ),
      };

    case 'DELETE_STORY':
      return {
        ...state,
        persons: state.persons.map((p) =>
          p.id === action.payload.personId
            ? {
                ...p,
                stories: p.stories.filter(
                  (s) => s.id !== action.payload.storyId,
                ),
              }
            : p,
        ),
      };

    default:
      return state;
  }
}

// --- Row mappers ---

function personToRow(p: Person, ownerId: string) {
  return {
    id: p.id,
    owner_id: ownerId,
    display_name: p.displayName,
    indigenous_name: p.indigenousName ?? null,
    skin_name: p.skinName ?? null,
    skin_name_gendered_prefix: p.skinNameGenderedPrefix ?? null,
    moiety: p.moiety ?? null,
    totem_personal: p.totemPersonal ?? null,
    totem_family: p.totemFamily ?? null,
    totem_clan: p.totemClan ?? null,
    totem_nation: p.totemNation ?? null,
    country_language_group: p.countryLanguageGroup ?? null,
    region_selector_value: p.regionSelectorValue,
    is_deceased: p.isDeceased,
    visibility: p.visibility,
    last_updated: p.lastUpdated,
    position_x: p.position.x,
    position_y: p.position.y,
  };
}

function storyToRow(s: Story, personId: string, ownerId: string) {
  return {
    id: s.id,
    owner_id: ownerId,
    person_id: personId,
    title: s.title,
    type: s.type,
    content: s.content,
    recorded_by: s.recordedBy,
    recorded_date: s.recordedDate,
    season_tag: s.seasonTag,
    seasonal_context: s.seasonalContext ?? null,
    place_connection: s.placeConnection ?? null,
    visibility: s.visibility,
    linked_person_ids: s.linkedPersonIds,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToStory(row: any): Story {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    content: row.content,
    recordedBy: row.recorded_by,
    recordedDate: row.recorded_date,
    seasonTag: row.season_tag,
    seasonalContext: row.seasonal_context ?? undefined,
    placeConnection: row.place_connection ?? undefined,
    visibility: row.visibility,
    linkedPersonIds: row.linked_person_ids ?? [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPerson(row: any, stories: Story[]): Person {
  return {
    id: row.id,
    displayName: row.display_name,
    indigenousName: row.indigenous_name ?? undefined,
    skinName: row.skin_name ?? undefined,
    skinNameGenderedPrefix: row.skin_name_gendered_prefix ?? undefined,
    moiety: row.moiety ?? undefined,
    totemPersonal: row.totem_personal ?? undefined,
    totemFamily: row.totem_family ?? undefined,
    totemClan: row.totem_clan ?? undefined,
    totemNation: row.totem_nation ?? undefined,
    countryLanguageGroup: row.country_language_group ?? undefined,
    regionSelectorValue: row.region_selector_value,
    isDeceased: row.is_deceased,
    stories,
    visibility: row.visibility,
    lastUpdated: row.last_updated,
    position: { x: row.position_x, y: row.position_y },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToRelationship(row: any): Relationship {
  return {
    id: row.id,
    fromPersonId: row.from_person_id,
    toPersonId: row.to_person_id,
    relationshipType: row.relationship_type,
    proximity: row.proximity,
    isAvoidance: row.is_avoidance,
    notes: row.notes ?? undefined,
  };
}

// --- Supabase sync (fire-and-forget) ---

const DATA_ACTIONS = new Set([
  'ADD_PERSON',
  'UPDATE_PERSON',
  'DELETE_PERSON',
  'ADD_RELATIONSHIP',
  'DELETE_RELATIONSHIP',
  'ADD_STORY',
  'UPDATE_STORY',
  'DELETE_STORY',
]);

async function syncToSupabase(
  action: AppAction,
  userId: string,
): Promise<void> {
  switch (action.type) {
    case 'ADD_PERSON': {
      const p = action.payload;
      await supabase.from('persons').insert(personToRow(p, userId));
      if (p.stories.length > 0) {
        await supabase
          .from('stories')
          .insert(p.stories.map((s) => storyToRow(s, p.id, userId)));
      }
      break;
    }
    case 'UPDATE_PERSON':
      await supabase
        .from('persons')
        .upsert(personToRow(action.payload, userId));
      break;

    case 'DELETE_PERSON':
      await supabase.from('persons').delete().eq('id', action.payload);
      break;

    case 'ADD_RELATIONSHIP':
      await supabase.from('relationships').insert({
        id: action.payload.id,
        owner_id: userId,
        from_person_id: action.payload.fromPersonId,
        to_person_id: action.payload.toPersonId,
        relationship_type: action.payload.relationshipType,
        proximity: action.payload.proximity,
        is_avoidance: action.payload.isAvoidance,
        notes: action.payload.notes ?? null,
      });
      break;

    case 'DELETE_RELATIONSHIP':
      await supabase
        .from('relationships')
        .delete()
        .eq('id', action.payload);
      break;

    case 'ADD_STORY': {
      const { personId, story } = action.payload;
      await supabase
        .from('stories')
        .insert(storyToRow(story, personId, userId));
      await supabase
        .from('persons')
        .update({ last_updated: new Date().toISOString() })
        .eq('id', personId);
      break;
    }
    case 'UPDATE_STORY': {
      const { personId, story } = action.payload;
      await supabase
        .from('stories')
        .upsert(storyToRow(story, personId, userId));
      await supabase
        .from('persons')
        .update({ last_updated: new Date().toISOString() })
        .eq('id', personId);
      break;
    }
    case 'DELETE_STORY':
      await supabase
        .from('stories')
        .delete()
        .eq('id', action.payload.storyId);
      break;
  }
}

// --- Context ---

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setRegion: (regionId: string) => void;
  user: User | null;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, localDispatch] = useReducer(appReducer, initialState);
  const [user, setUser] = useState<User | null>(null);

  // --- Auth state listener ---
  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (mounted) setUser(u ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // --- Load data from Supabase when user is authenticated ---
  useEffect(() => {
    if (!user) {
      localDispatch({
        type: 'INIT',
        payload: { ...initialState, initialized: true },
      });
      return;
    }

    async function load() {
      try {
        const savedRegion = localStorage.getItem(REGION_KEY);

        const [personsRes, storiesRes, relsRes] = await Promise.all([
          supabase.from('persons').select('*'),
          supabase.from('stories').select('*'),
          supabase.from('relationships').select('*'),
        ]);

        // Group stories by person
        const storiesByPerson = new Map<string, Story[]>();
        for (const row of storiesRes.data ?? []) {
          const story = rowToStory(row);
          const list = storiesByPerson.get(row.person_id) ?? [];
          list.push(story);
          storiesByPerson.set(row.person_id, list);
        }

        const persons: Person[] = (personsRes.data ?? []).map((row) =>
          rowToPerson(row, storiesByPerson.get(row.id) ?? []),
        );
        const relationships: Relationship[] = (relsRes.data ?? []).map(
          rowToRelationship,
        );

        // Recompute calendar from saved region preference
        let kinshipTemplate = null;
        let seasonalCalendar = null;
        let currentSeasonId = null;

        if (savedRegion) {
          const region = regions.find((r) => r.id === savedRegion);
          if (region) {
            seasonalCalendar = allCalendars[region.calendarId];
            kinshipTemplate = kinshipTemplates[region.kinshipTemplateType];
            currentSeasonId = getCurrentSeason(seasonalCalendar)?.id ?? null;
          }
        }

        localDispatch({
          type: 'INIT',
          payload: {
            persons,
            relationships,
            selectedRegion: savedRegion,
            kinshipTemplate,
            seasonalCalendar,
            currentSeasonId,
            initialized: true,
          },
        });
      } catch {
        localDispatch({
          type: 'INIT',
          payload: { ...initialState, initialized: true },
        });
      }
    }

    load();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Dispatch wrapper: optimistic local update + Supabase sync ---
  const dispatch = useCallback(
    (action: AppAction) => {
      localDispatch(action);

      if (action.type === 'SET_REGION') {
        localStorage.setItem(REGION_KEY, action.payload.regionId);
        return;
      }

      if (user && DATA_ACTIONS.has(action.type)) {
        syncToSupabase(action, user.id).catch(console.error);
      }
    },
    [user],
  );

  const setRegion = useCallback(
    (regionId: string) => {
      const region = regions.find((r) => r.id === regionId);
      if (!region) return;
      const calendar = allCalendars[region.calendarId];
      const template = kinshipTemplates[region.kinshipTemplateType];
      const season = getCurrentSeason(calendar);

      dispatch({
        type: 'SET_REGION',
        payload: {
          regionId,
          kinshipTemplate: template,
          seasonalCalendar: calendar,
          currentSeasonId: season?.id ?? null,
        },
      });
    },
    [dispatch],
  );

  const signOut = useCallback(async () => {
    localStorage.removeItem(REGION_KEY);
    await supabase.auth.signOut();
  }, []);

  return (
    <AppContext value={{ state, dispatch, setRegion, user, signOut }}>
      {children}
    </AppContext>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
