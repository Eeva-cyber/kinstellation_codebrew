import type { Region } from '../types';

export const regions: Region[] = [
  {
    id: 'noongar',
    displayName: 'Noongar',
    description:
      'South-west Western Australia. Six seasons follow the cycle of the land from hot dry Birak through to wildflower Kambarang.',
    calendarId: 'noongar',
    kinshipTemplateType: 'moiety_only',
  },
  {
    id: 'yolngu',
    displayName: 'Yolngu',
    description:
      'Arnhem Land, Northern Territory. Seasons follow the monsoon cycle from buildup through wet and dry.',
    calendarId: 'yolngu',
    kinshipTemplateType: 'moiety_only',
  },
  {
    id: 'dharawal',
    displayName: "D'harawal",
    description:
      'Sydney basin, NSW. Six seasons marked by flowering, fruiting, and animal behaviour patterns.',
    calendarId: 'dharawal',
    kinshipTemplateType: 'four_section',
  },
  {
    id: 'warlpiri',
    displayName: 'Warlpiri',
    description:
      'Central Australia. Eight subsection skin name system with gendered prefixes. Seasons follow the desert cycle.',
    calendarId: 'generic',
    kinshipTemplateType: 'gendered_subsection',
  },
  {
    id: 'torres_strait',
    displayName: 'Torres Strait Islander',
    description:
      'Torres Strait Islands. Seasons follow the monsoon (Kuki) and trade winds (Sager). Clan-totem kinship tied to islands.',
    calendarId: 'torres_strait',
    kinshipTemplateType: 'torres_strait_clan',
  },
  {
    id: 'not_sure',
    displayName: "I'm not sure yet",
    description:
      "That's okay. Start with a simple framework and add cultural detail as you learn. You can change this later.",
    calendarId: 'generic',
    kinshipTemplateType: 'moiety_only',
  },
];
