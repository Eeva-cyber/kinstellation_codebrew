'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { AppState, AppAction } from '../types';
import { allCalendars } from '../data/seasonal-calendars';
import { kinshipTemplates } from '../data/kinship-templates';
import { regions } from '../data/regions';
import { getCurrentSeason } from '../utils/season';

const STORAGE_KEY = 'kinstellation_state';

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

    case 'SET_REGION': {
      return {
        ...state,
        selectedRegion: action.payload.regionId,
        kinshipTemplate: action.payload.kinshipTemplate,
        seasonalCalendar: action.payload.seasonalCalendar,
        currentSeasonId: action.payload.currentSeasonId,
        initialized: true,
      };
    }

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
            r.fromPersonId !== action.payload && r.toPersonId !== action.payload,
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

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setRegion: (regionId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AppState;
        // Recompute current season from the calendar
        if (parsed.seasonalCalendar) {
          const season = getCurrentSeason(parsed.seasonalCalendar);
          parsed.currentSeasonId = season?.id ?? null;
        }
        dispatch({ type: 'INIT', payload: { ...parsed, initialized: true } });
      } else {
        dispatch({ type: 'INIT', payload: { ...initialState, initialized: true } });
      }
    } catch {
      dispatch({ type: 'INIT', payload: { ...initialState, initialized: true } });
    }
  }, []);

  // Persist to localStorage on every state change (skip before init)
  useEffect(() => {
    if (state.initialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

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
    [],
  );

  return (
    <AppContext value={{ state, dispatch, setRegion }}>
      {children}
    </AppContext>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
