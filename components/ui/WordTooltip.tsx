'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const GLOSSARY: Record<string, string> = {
  // Kinship structure
  Moiety:
    'One of two complementary halves that divide all people and creation. All things belong to one moiety — it governs relationships, responsibilities, and ceremony.',
  'Skin name':
    'A kinship classification that determines relationships, responsibilities, and who a person can marry. Each skin name carries specific rights and obligations.',
  'Skin Name':
    'A kinship classification that determines relationships, responsibilities, and who a person can marry. Each skin name carries specific rights and obligations.',
  Classificatory:
    'Kinship terms extended beyond biological family. A "classificatory mother" is treated with the same respect and obligations as a birth mother under the kinship system.',
  'Classificatory mother':
    'A woman who holds the role of mother within the kinship system, even without a biological connection. She carries the same responsibilities and respect as a birth mother.',
  'Classificatory father':
    'A man who holds the role of father within the kinship system. He carries the same responsibilities and respect as a birth father.',
  'Classificatory sibling':
    'A person who is treated as a sibling under the kinship system, carrying the same obligations and bonds as a biological sibling.',
  Avoidance:
    'A formal kinship rule requiring social distance between certain relatives — a sign of deep respect, not conflict. For example, a man and his mother-in-law may practise avoidance.',
  Totemic:
    'A connection to a spiritual ancestor or totem — an animal, plant, or natural phenomenon that is sacred to a person, family, or clan and shapes their identity and responsibilities.',
  'Country connection':
    'A relationship grounded in shared traditional Country — the living bond between people and their homeland, including its spiritual, cultural, and ecological dimensions.',
  'Kupai Omasker':
    'A Torres Strait Islander term for a specific reciprocal kinship relationship, often involving the children of cross-cousins. It carries distinct rights and ceremonial obligations.',
  Country:
    'The traditional homeland of an Aboriginal or Torres Strait Islander person — not just land, but a living relationship with place, spirit, law, and identity.',
  Dreaming:
    'The Dreaming refers to the ancestral creation stories, laws, and spiritual beliefs that explain the origin of the world and continue to govern life, relationships, and ceremony.',
  Augadh:
    'A Torres Strait Islander totem — the sacred symbol connecting a person to their clan and ancestral identity.',

  // Noongar seasons (SW Western Australia)
  Birak:
    'Noongar first summer season (December–January). Hot dry weather; time of the first people. Zamia nuts ripen.',
  Bunuru:
    'Noongar second summer season (February–March). The hottest and driest time of year. Hakea blossoms attract birds.',
  Djeran:
    'Noongar autumn season (April–May). Cooler nights and calm weather. Ants build up their hills as a sign of the season.',
  Makuru:
    'Noongar winter season (June–July). The most powerful season of cold rain and storms. Plants and animals shelter and rest.',
  Djilba:
    'Noongar late-winter to spring transition (August–September). A mix of wet days and clear sunny days. Wattle blossoms begin to appear.',
  Kambarang:
    'Noongar wildflower season (October–November). The flowering of the land. Wildflowers emerge across the landscape.',

  // Yolngu seasons (Arnhem Land, NT)
  Dharratharramirri:
    'Yolngu pre-wet buildup season. Heat and humidity build before the monsoon rains arrive. A tense and powerful time.',
  "Barra'mirri":
    'Yolngu wet monsoon season. Heavy rains, flooding, and abundant life. Many ceremonies take place at this time.',
  Mainmak:
    'Yolngu post-wet season of knock-em-down storms. Tall grasses bend in storm cells that clear the land.',
  Midawarr:
    'Yolngu mid-dry season of harvest, abundance, and ceremony. Animals and plants are plentiful. An important time for gathering.',
  Dharratharr:
    'Yolngu late-dry season. Cooler nights, clear skies, and preparation for the coming wet season.',
  Rarranhdharr:
    'Yolngu cool dry season. The land rests as the cycle winds toward the next wet.',

  // D\'harawal seasons (Sydney Basin, NSW)
  Ngoonungi:
    "D'harawal season of cool becoming cold. The first signs of winter approaching.",
  Wiritjiribin:
    "D'harawal season of cold, short days. The coldest and darkest part of the year.",
  Tumburung:
    "D'harawal season of cold becoming warm. Life begins to stir and plants start to grow again.",
  "Marrai'gang":
    "D'harawal season of warm and wet. Rain brings new growth across the land.",
  'Gadalung Marool':
    "D'harawal season of hot and dry. The driest and brightest part of the year.",
  Burran:
    "D'harawal season of hot becoming cool. Eels begin their run — an important time for fishing.",

  // Torres Strait seasons
  Kuki:
    'Torres Strait NW monsoon season. Rain, rough seas, and strong north-westerly winds shape life on the islands.',
  Sager:
    'Torres Strait SE trade wind season. Calmer, cooler conditions that favour fishing, travel, and ceremony.',
  Naigai:
    'Torres Strait transitional season between the monsoon and the trade winds. A time of change on the water.',

  // Moiety names
  Dhuwa:
    'One of two complementary moieties in Yolngu kinship. Dhuwa and Yirritja together encompass all of creation — every person, animal, plant, wind, and rain belongs to one moiety. Your moiety shapes your ceremony roles, marriage partners, and relationship to the natural world.',
  Yirritja:
    'One of two complementary moieties in Yolngu kinship. Dhuwa and Yirritja together encompass all of creation. Your moiety determines your ceremony responsibilities, who you can marry, and your relationship to the spiritual and natural world.',
  Burung:
    'One of two moieties in the four-section kinship system. Together with the other moiety, Burung divides all people and creation into complementary halves that govern relationships and obligations.',
  Gamilaraay:
    'One of two moieties in the four-section kinship system, also the name of the language and nation of central and northern New South Wales. Your moiety determines kinship obligations and ceremony roles.',
  'Sun side':
    'One of two moieties in the eight-subsection desert kinship system. Sun side and Shade side together divide all people and creation into complementary halves, governing marriage rules, ceremony, and responsibilities.',
  'Shade side':
    'One of two moieties in the eight-subsection desert kinship system. Sun side and Shade side together divide all people and creation into complementary halves, governing marriage rules, ceremony, and responsibilities.',
  'Koey Buway (Land)':
    'One of two complementary moiety groupings in Torres Strait Islander kinship, connected to the land and its stories. Together with the Sea moiety, it structures relationships, ceremony, and obligations across the islands.',
  'Koey Buway (Sea)':
    'One of two complementary moiety groupings in Torres Strait Islander kinship, connected to the sea and its stories. Together with the Land moiety, it structures relationships, ceremony, and obligations across the islands.',

  // Celestial
  Tagai:
    'A Torres Strait Islander constellation representing a fisherman standing in a canoe, holding a spear and a fruit. Tagai guides seasonal fishing, planting, and navigation across the island waters.',
};

interface WordTooltipProps {
  term: string;
  /** Override the glossary — use this for dynamic terms like moiety names. */
  definition?: string;
  children: React.ReactNode;
  className?: string;
}

export function WordTooltip({ term, definition: definitionProp, children, className }: WordTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const definition = definitionProp ?? GLOSSARY[term];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!definition) return <>{children}</>;

  function updateCoords() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ x: rect.left + rect.width / 2, y: rect.top });
    }
  }

  const tooltip =
    visible && mounted
      ? createPortal(
          <div
            className="fixed pointer-events-none"
            style={{
              zIndex: 99999,
              left: coords.x,
              top: coords.y,
              transform: 'translate(-50%, calc(-100% - 8px))',
            }}
          >
            <div
              className="w-60 px-3 py-2.5 rounded-xl shadow-2xl
                bg-[#080b14] border border-white/[0.12]
                text-[10px] text-white/70 leading-relaxed"
            >
              <span className="font-medium text-white/90 block mb-1">{term}</span>
              {definition}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <span
      ref={triggerRef}
      className={`relative inline-block cursor-help border-b border-dotted border-white/25 ${className ?? ''}`}
      onMouseEnter={() => { updateCoords(); setVisible(true); }}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => { updateCoords(); setVisible(true); }}
      onBlur={() => setVisible(false)}
    >
      {children}
      {tooltip}
    </span>
  );
}
