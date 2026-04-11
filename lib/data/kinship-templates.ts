import type { KinshipTemplate, KinshipTemplateType } from '../types';

export const kinshipTemplates: Record<KinshipTemplateType, KinshipTemplate> = {
  /**
   * Generic two-moiety system. Used for non-Kulin Victorian groups
   * whose specific moiety names are not yet documented here.
   * Moiety law — the two complementary halves of creation — exists
   * across many Victorian language groups, though names vary by Country.
   */
  moiety_only: {
    templateType: 'moiety_only',
    description:
      'Your Country has a moiety system — two complementary halves that organise kinship, marriage, and ceremony. ' +
      'Every person, animal, plant and element of Country belongs to one half. ' +
      'Specific moiety names vary by language group and may not be publicly recorded here yet.',
  },

  /**
   * Kulin Nation — the five language groups of central and southern Victoria.
   * Bunjil (Wedge-tailed Eagle) and Waa (Crow) are the two creator-spirit moieties.
   * Every Kulin person, animal, and element of Country belongs to one moiety.
   * You must marry into the opposite moiety.
   * Sources: Wurundjeri Woi Wurrung Cultural Heritage Aboriginal Corporation;
   * First Peoples – State Relations (Victorian Government).
   */
  kulin_nation: {
    templateType: 'kulin_nation',
    moietyNames: ['Bunjil', 'Waa'],
    description:
      'Kulin Nation peoples of Victoria follow the Bunjil and Waa moiety system. ' +
      'Bunjil (the Wedge-tailed Eagle) and Waa (the Crow) are creator spirits who gave life and law to Country. ' +
      'Your moiety is inherited and governs marriage, ceremony, and responsibility to Country.',
  },

  /**
   * Warlpiri — Tanami Desert, Northern Territory.
   * Warlpiri moiety divides all people, animals, plants and elements of Country
   * into two complementary halves: Sun side and Shade side.
   * Moiety is patrilineal and governs marriage, ceremony, and skin-name inheritance.
   * Sources: Meggitt (1962) Desert People; Warlpiri Jukurrpa knowledge held by community.
   */
  warlpiri: {
    templateType: 'warlpiri',
    moietyNames: ['Sun side', 'Shade side'],
    description:
      'Warlpiri people of the Tanami Desert follow a moiety system that divides all people, animals, plants and elements of Country into two complementary halves — Sun side and Shade side. ' +
      'Your moiety is inherited from your father and governs marriage, ceremony, and your relationships to Country. ' +
      'Skin names encode both moiety and generation level.',
  },
};
