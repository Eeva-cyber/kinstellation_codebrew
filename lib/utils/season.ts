import type { Season, SeasonalCalendar } from '../types';

export function getCurrentSeason(calendar: SeasonalCalendar): Season | null {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  return calendar.seasons.find((s) => s.approximateMonths.includes(currentMonth)) ?? null;
}

export function getSeasonById(calendar: SeasonalCalendar, id: string): Season | undefined {
  return calendar.seasons.find((s) => s.id === id);
}

export function getStarRadius(storyCount: number): number {
  const base = 4;
  const perStory = 2.5;
  const max = 18;
  return Math.min(base + storyCount * perStory, max);
}

export function getStarOpacity(storyCount: number, lastUpdated: string): number {
  const base = storyCount === 0 ? 0.25 : 0.6 + Math.min(storyCount * 0.08, 0.4);
  const daysSinceUpdate =
    (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
  const decay = daysSinceUpdate > 90 ? Math.max(0.15, 1 - (daysSinceUpdate - 90) / 365) : 1;
  return base * decay;
}

export function hasStoriesInSeason(
  stories: { seasonTag: string }[],
  seasonId: string | null,
): boolean {
  if (!seasonId) return false;
  return stories.some((s) => s.seasonTag === seasonId);
}
