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
import type { AppState, AppAction, Person, Relationship } from '../types';
import { allCalendars } from '../data/seasonal-calendars';
import { kinshipTemplates } from '../data/kinship-templates';
import { regions } from '../data/regions';
import { getCurrentSeason } from '../utils/season';
import { supabase } from '../supabase';
import { DEMO_PERSONS, DEMO_RELATIONSHIPS } from '../data/demo-nodes';

const REGION_KEY = 'kinstellation_region';
const DATA_KEY   = 'kinstellation_data';

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
          (r) => r.fromPersonId !== action.payload && r.toPersonId !== action.payload,
        ),
      };

    case 'ADD_RELATIONSHIP':
      return { ...state, relationships: [...state.relationships, action.payload] };

    case 'DELETE_RELATIONSHIP':
      return {
        ...state,
        relationships: state.relationships.filter((r) => r.id !== action.payload),
      };

    case 'ADD_STORY':
      return {
        ...state,
        persons: state.persons.map((p) =>
          p.id === action.payload.personId
            ? { ...p, stories: [...p.stories, action.payload.story], lastUpdated: new Date().toISOString() }
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
                stories: p.stories.filter((s) => s.id !== action.payload.storyId),
              }
            : p,
        ),
      };

    case 'ADD_MEDIA_ENTRY':
      return {
        ...state,
        persons: state.persons.map((p) =>
          p.id === action.payload.personId
            ? {
                ...p,
                mediaEntries: [...(p.mediaEntries ?? []), action.payload.entry],
                lastUpdated: new Date().toISOString(),
              }
            : p,
        ),
      };

    case 'DELETE_MEDIA_ENTRY':
      return {
        ...state,
        persons: state.persons.map((p) =>
          p.id === action.payload.personId
            ? {
                ...p,
                mediaEntries: (p.mediaEntries ?? []).filter(
                  (e) => e.id !== action.payload.entryId,
                ),
              }
            : p,
        ),
      };

    default:
      return state;
  }
}

// ── localStorage persistence ──────────────────────────────────────────────────

function saveToLocalStorage(state: AppState) {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify({
      persons: state.persons,
      relationships: state.relationships,
    }));
  } catch { /* localStorage full or unavailable */ }
}

function loadFromLocalStorage(): { persons: Person[]; relationships: Relationship[] } | null {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.persons && Array.isArray(data.persons)) {
      return { persons: data.persons, relationships: data.relationships ?? [] };
    }
  } catch { /* corrupt data */ }
  return null;
}

// ── Context ───────────────────────────────────────────────────────────────────

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

  // ── Auth state listener ────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (mounted) setUser(u ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  // ── Load from localStorage, seed demo data if fresh ───────────────────────
  useEffect(() => {
    const savedRegion = localStorage.getItem(REGION_KEY);
    let seasonalCalendar = null;
    let kinshipTemplate  = null;
    let currentSeasonId  = null;

    if (savedRegion) {
      const region = regions.find((r) => r.id === savedRegion);
      if (region) {
        seasonalCalendar = allCalendars[region.calendarId];
        kinshipTemplate  = kinshipTemplates[region.kinshipTemplateType];
        currentSeasonId  = getCurrentSeason(seasonalCalendar)?.id ?? null;
      }
    }

    const saved    = loadFromLocalStorage();
    // Only use demo data if this is a brand-new session (no saved data and no profile)
    const isNewSession = !saved && !localStorage.getItem('kinstellation_self_id');
    const persons      = saved?.persons       ?? (isNewSession ? [...DEMO_PERSONS]       : []);
    const relationships = saved?.relationships ?? (isNewSession ? [...DEMO_RELATIONSHIPS] : []);

    localDispatch({
      type: 'INIT',
      payload: {
        persons,
        relationships,
        selectedRegion: savedRegion,
        seasonalCalendar,
        kinshipTemplate,
        currentSeasonId,
        initialized: true,
      },
    });
  }, []);

  // ── Persist to localStorage on every change ────────────────────────────────
  useEffect(() => {
    if (!state.initialized) return;
    saveToLocalStorage(state);
  }, [state]);

  // ── Dispatch wrapper ───────────────────────────────────────────────────────
  const dispatch = useCallback((action: AppAction) => {
    localDispatch(action);
    if (action.type === 'SET_REGION') {
      localStorage.setItem(REGION_KEY, action.payload.regionId);
    }
  }, []);

  const setRegion = useCallback((regionId: string) => {
    const region = regions.find((r) => r.id === regionId);
    if (!region) return;
    const calendar = allCalendars[region.calendarId];
    const template = kinshipTemplates[region.kinshipTemplateType];
    const season   = getCurrentSeason(calendar);
    dispatch({
      type: 'SET_REGION',
      payload: {
        regionId,
        kinshipTemplate: template,
        seasonalCalendar: calendar,
        currentSeasonId: season?.id ?? null,
      },
    });
  }, [dispatch]);

  const signOut = useCallback(async () => {
    localStorage.removeItem(REGION_KEY);
    localStorage.removeItem('kinstellation_profile');
    localStorage.removeItem('kinstellation_self_id');
    localStorage.removeItem('kinstellation_tutorial_pending');
    localStorage.removeItem(DATA_KEY);
    await supabase.auth.signOut();
    window.location.href = '/';
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
