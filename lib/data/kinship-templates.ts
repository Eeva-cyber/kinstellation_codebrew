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

  /**
   * Yorta Yorta — Dungala (Murray River) peoples.
   * Eaglehawk / Crow moiety system, well-documented for Murray River and adjacent peoples.
   * Sources: Howitt (1904) The Native Tribes of South-East Australia;
   * AIATSIS; Yorta Yorta Nation Aboriginal Corporation.
   */
  yorta_yorta: {
    templateType: 'yorta_yorta',
    moietyNames: ['Eaglehawk', 'Crow'],
    description:
      'Yorta Yorta people of the Dungala (Murray River) follow the Eaglehawk and Crow moiety system. ' +
      'These two complementary halves organise kinship, marriage, and ceremony across the Murray River peoples. ' +
      'Your moiety is inherited and governs your relationships to Country, kin, and ceremony.',
  },

  /**
   * Wergaia — Mallee and Wimmera region.
   * Krokitch (White Cockatoo) / Kapoogi (Crow) documented phratry system.
   * Sources: Howitt (1904) The Native Tribes of South-East Australia;
   * AIATSIS records for northwest Victorian groups (Wotjobaluk/Wergaia).
   */
  wergaia: {
    templateType: 'wergaia',
    moietyNames: ['Krokitch (White Cockatoo)', 'Kapoogi (Crow)'],
    description:
      'Wergaia people of the Mallee and Wimmera follow the Krokitch and Kapoogi phratry system. ' +
      'Krokitch (White Cockatoo) and Kapoogi (Crow) are the two complementary halves ' +
      'that organise kinship, marriage, and ceremony across Country.',
  },

  /**
   * Gunditjmara — South-west Victoria.
   * Krokitch / Kapoogi documented phratry system, shared with adjacent Mallee-Wimmera groups.
   * Sources: Howitt (1904); AIATSIS.
   */
  gunditjmara: {
    templateType: 'gunditjmara',
    moietyNames: ['Krokitch (White Cockatoo)', 'Kapoogi (Crow)'],
    description:
      'Gunditjmara people of south-west Victoria follow the Krokitch and Kapoogi phratry system. ' +
      'Your moiety organises kinship, marriage, and ceremony, and your connection to Budj Bim Country.',
  },
};
