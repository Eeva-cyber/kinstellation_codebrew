import type { KinshipTemplate, KinshipTemplateType } from '../types';

export const kinshipTemplates: Record<KinshipTemplateType, KinshipTemplate> = {
  moiety_only: {
    templateType: 'moiety_only',
    moietyNames: ['Dhuwa', 'Yirritja'],
    description:
      'Two moieties divide all of creation into complementary halves. Every person, animal, plant, and natural phenomenon belongs to one moiety.',
  },
  four_section: {
    templateType: 'four_section',
    moietyNames: ['Burung', 'Gamilaraay'],
    sectionNames: ['Murri', 'Kubbi', 'Ippai', 'Kumbo'],
    description:
      'Four skin groups (sections) govern marriage rules and social obligations. Your section determines who you can marry and your children\'s section.',
  },
  eight_subsection: {
    templateType: 'eight_subsection',
    moietyNames: ['Sun side', 'Shade side'],
    sectionNames: [
      'Japanangka', 'Jupurrurla', 'Jakamarra', 'Jampijinpa',
      'Japangardi', 'Jungarrayi', 'Japaljarri', 'Jangala',
    ],
    description:
      'Eight subsections provide a detailed system of kinship classification. Each subsection has specific relationships and obligations to all others.',
  },
  gendered_subsection: {
    templateType: 'gendered_subsection',
    moietyNames: ['Sun side', 'Shade side'],
    sectionNames: [
      'Japanangka/Napanangka', 'Jupurrurla/Napurrurla',
      'Jakamarra/Nakamarra', 'Jampijinpa/Nampijinpa',
      'Japangardi/Napangardi', 'Jungarrayi/Nungarrayi',
      'Japaljarri/Napaljarri', 'Jangala/Nangala',
    ],
    genderedPrefixes: { male: 'J', female: 'N' },
    description:
      'Eight subsections with gendered prefixes (J- for men, N- for women). This system is used by Warlpiri and related Central/Western Desert language groups.',
  },
  torres_strait_clan: {
    templateType: 'torres_strait_clan',
    moietyNames: ['Koey Buway (Land)', 'Koey Buway (Sea)'],
    description:
      'Torres Strait Islander kinship is organised through clan-totem groups tied to specific islands and marine territories. Identity comes from your island, your totem (augadh), and your clan.',
  },
};
