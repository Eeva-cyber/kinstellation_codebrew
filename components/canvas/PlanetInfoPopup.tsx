'use client';

import { regions } from '@/lib/data/regions';

export interface AttributeClickInfo {
  type: 'nation' | 'language' | 'community';
  value: string;
  personName: string;
  personId: string;
  color: string;
}

interface PlanetInfoPopupProps {
  info: AttributeClickInfo;
  onClose: () => void;
  onViewProfile: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  nation:    'Nation',
  language:  'Language Group',
  community: 'Community',
};

// Specific contextual descriptions scoped to south-eastern Australia
const TYPE_CONTEXT: Record<string, string> = {
  nation:
    'An Aboriginal Nation of Australia, specifically from Victoria or southern New South Wales. ' +
    'Each Nation has distinct Country, language, and Law — maintained continuously for over 60,000 years. ' +
    'Victorian Nations include Wurundjeri, Boon Wurrung, Wadawurrung, Dja Dja Wurrung, Taungurung, ' +
    'Gunditjmara, Djab wurrung, and many others across the state.',
  language:
    'A language spoken on Aboriginal Country in south-eastern Australia, primarily in Victoria or southern New South Wales. ' +
    'Victorian languages — including Woiwurrung, Boon Wurrung, Dhauwurd Wurrung, Wemba-Wemba, Wergaia, ' +
    'and many others — each carry unique knowledge of Country, seasons, and law. ' +
    'Language revival is central to cultural healing across Koorie communities today.',
  community:
    'A local Aboriginal community in south-eastern Australia. Aboriginal community life in Victoria and ' +
    'southern New South Wales is organised through family, Country, and ceremony — not just geographic location. ' +
    'Community connections link people to law, language, and to the land that has sustained their ancestors for thousands of generations.',
};

// Specific descriptions for well-known community terms
const COMMUNITY_DESCRIPTIONS: Record<string, { text: string; detail: string }> = {
  koorie: {
    text:
      'Koorie (also spelled Koori) is the collective name used by Aboriginal peoples of Victoria ' +
      'and parts of southern New South Wales to refer to themselves and their community. ' +
      'It covers the area roughly south of the Murray–Darling Basin and east of South Australia — ' +
      'including all of Victoria, the Australian Capital Territory, and the southern NSW border corridor ' +
      'around the Murray River, Albury–Wodonga, and the Snowy Mountains.',
    detail:
      'Victorian Koorie Nations include Wurundjeri Woi Wurrung, Boon Wurrung, Wadawurrung, ' +
      'Dja Dja Wurrung, Taungurung, Gunditjmara, Djab wurrung, Wathaurong, and Yorta Yorta, among others. ' +
      'Southern NSW Koori peoples include Wiradjuri, Yuin, Ngarigo, Bidhawal, and Ngunnawal communities. ' +
      'Koorie/Koori is distinct from other regional identities across Australia: Murri (Queensland), ' +
      'Noongar (south-west Western Australia), Anangu (central Australia), Palawa (Tasmania), ' +
      'and Yolŋu (north-east Arnhem Land). ' +
      'It is used in community-controlled bodies such as the Koorie Heritage Trust (Melbourne), ' +
      'Koorie Courts, Koorie Maternity Services, and Koorie education programs across Victoria.',
  },
  koori: {
    text:
      'Koori (also spelled Koorie) is the collective name used by Aboriginal peoples of Victoria ' +
      'and parts of southern New South Wales to refer to themselves and their community. ' +
      'It covers the area roughly south of the Murray–Darling Basin and east of South Australia — ' +
      'including all of Victoria, the Australian Capital Territory, and the southern NSW border corridor ' +
      'around the Murray River, Albury–Wodonga, and the Snowy Mountains.',
    detail:
      'Victorian Koori Nations include Wurundjeri Woi Wurrung, Boon Wurrung, Wadawurrung, ' +
      'Dja Dja Wurrung, Taungurung, Gunditjmara, Djab wurrung, Wathaurong, and Yorta Yorta, among others. ' +
      'Southern NSW Koori peoples include Wiradjuri, Yuin, Ngarigo, Bidhawal, and Ngunnawal communities. ' +
      'Koori/Koorie is distinct from other regional identities across Australia: Murri (Queensland), ' +
      'Noongar (south-west Western Australia), Anangu (central Australia), Palawa (Tasmania), ' +
      'and Yolŋu (north-east Arnhem Land). ' +
      'It is used in community-controlled bodies such as the Koorie Heritage Trust (Melbourne), ' +
      'Koorie Courts, Koorie Maternity Services, and Koorie education programs across Victoria.',
  },
};

// Try to match a value against the regions database.
// For nation: exact match on displayName or alternateNames.
// For language: also try substring matching since language names often appear within nation names
//   (e.g. 'Woiwurrung' appears in alternateNames for Wurundjeri Woi Wurrung).
function findRegion(type: string, value: string) {
  const v = value.toLowerCase().trim();
  // Exact match first (works for both nation and language)
  const exact = regions.find(
    (r) =>
      r.displayName.toLowerCase() === v ||
      (r.alternateNames ?? []).some((n) => n.toLowerCase() === v),
  );
  if (exact) return exact;

  // Language group: try substring / contains matching
  if (type === 'language') {
    return (
      regions.find(
        (r) =>
          r.displayName.toLowerCase().includes(v) ||
          (r.alternateNames ?? []).some((n) => n.toLowerCase().includes(v) || v.includes(n.toLowerCase())),
      ) ?? null
    );
  }
  return null;
}

export function PlanetInfoPopup({ info, onClose, onViewProfile }: PlanetInfoPopupProps) {
  const region = findRegion(info.type, info.value);
  const communityEntry = info.type === 'community'
    ? COMMUNITY_DESCRIPTIONS[info.value.toLowerCase()] ?? null
    : null;
  const typeLabel = TYPE_LABELS[info.type] ?? info.type;
  const c = info.color;

  // When we match via language substring, frame the content as language info rather than nation info
  const isLanguageSubstringMatch = info.type === 'language' && region &&
    !region.displayName.toLowerCase().includes(info.value.toLowerCase().substring(0, 4));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full max-w-md rounded-2xl shadow-2xl animate-fade-in"
        style={{
          background: 'rgba(8,4,22,0.98)',
          border: `1px solid ${c}55`,
          boxShadow: `0 0 48px ${c}1a, 0 25px 50px rgba(0,0,0,0.65)`,
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-3.5 min-w-0">
              <span
                className="shrink-0 rounded-full"
                style={{
                  width: 18, height: 18,
                  background: `radial-gradient(circle at 35% 35%, white, ${c})`,
                  boxShadow: `0 0 12px ${c}cc, 0 0 24px ${c}44`,
                }}
              />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5"
                  style={{ color: `${c}bb` }}>
                  {typeLabel}
                </p>
                <h2 className="text-xl font-bold leading-tight"
                  style={{ color: 'rgba(255,255,255,0.97)' }}>
                  {info.value}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-xl leading-none shrink-0 transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.45)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.80)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          {/* Community-specific description */}
          {communityEntry && (
            <div className="space-y-3 mb-5">
              <div
                className="px-4 py-3 rounded-xl"
                style={{ background: `${c}0d`, border: `1px solid ${c}2a` }}
              >
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.88)' }}>
                  {communityEntry.text}
                </p>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.68)' }}>
                {communityEntry.detail}
              </p>
            </div>
          )}

          {/* Region info (nation or language match) */}
          {region && !communityEntry && (
            <div className="space-y-3 mb-5">
              {region.countryDescription && (
                <div
                  className="px-4 py-3 rounded-xl"
                  style={{ background: `${c}0d`, border: `1px solid ${c}2a` }}
                >
                  <p className="text-[10px] uppercase tracking-widest font-semibold mb-1.5"
                    style={{ color: `${c}99` }}>
                    {info.type === 'language' ? 'Country of Language' : 'Country'}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.88)' }}>
                    {region.countryDescription}
                  </p>
                </div>
              )}
              {region.description && !isLanguageSubstringMatch && (
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
                  {region.description}
                </p>
              )}
              {isLanguageSubstringMatch && (
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
                  {info.value} is a language of the {region.displayName} people, spoken on Country in{' '}
                  {region.stateTerritory ?? 'Victoria'}. Language and Country are inseparable — the language
                  carries knowledge of the land, seasons, and law that no translation can fully hold.
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {region.stateTerritory && (
                  <span
                    className="text-[10px] px-2.5 py-1 rounded-lg font-medium"
                    style={{ background: 'rgba(88,28,135,0.35)', border: '1px solid rgba(139,92,246,0.3)', color: 'rgba(139,92,246,0.85)' }}
                  >
                    {region.stateTerritory}, Australia
                  </span>
                )}
                {region.alternateNames && region.alternateNames.length > 0 && (
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.32)' }}>
                    Also known as: {region.alternateNames.slice(0, 2).join(', ')}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Generic fallback — no match and no community entry */}
          {!region && !communityEntry && (
            <div
              className="px-4 py-3 rounded-xl mb-5"
              style={{ background: 'rgba(88,28,135,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}
            >
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.68)' }}>
                {TYPE_CONTEXT[info.type]}
              </p>
            </div>
          )}

          {/* Footer */}
          <div
            className="flex items-center justify-between pt-4"
            style={{ borderTop: `1px solid ${c}1f` }}
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: c, boxShadow: `0 0 5px ${c}` }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {info.personName}&apos;s {typeLabel.toLowerCase()}
              </span>
            </div>
            <button
              onClick={() => { onViewProfile(); onClose(); }}
              className="text-xs px-3 py-1.5 rounded-xl transition-all font-medium"
              style={{ background: 'rgba(88,28,135,0.35)', border: '1px solid rgba(139,92,246,0.35)', color: 'rgba(212,164,84,0.85)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(88,28,135,0.55)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(88,28,135,0.35)'; }}
            >
              View full profile →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
