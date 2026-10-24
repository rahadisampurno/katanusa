import { experts } from './experts.ts';
import type { Expert } from '../types/expert.ts';

type ServerExpert = Record<string, unknown>;

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value : undefined;

const findLocalPersona = (serverExpert: ServerExpert): Expert | undefined => {
  const id = text(serverExpert.id);
  const name = text(serverExpert.name) ?? text(serverExpert.public_name);
  const slug = text(serverExpert.slug);

  return experts.find((expert) => {
    const expertSlug = expert.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return expert.id === id || expert.name === name || expertSlug === slug;
  });
};

export const resolveExpertPersona = (serverExpert: ServerExpert): Expert => {
  const local = findLocalPersona(serverExpert);
  const serverSpecialties = serverExpert.specialties ?? serverExpert.domains;
  const serverReferences = serverExpert.realExpertReferences;
  const serverAccentHints = serverExpert.accentHints;

  return {
    id: text(serverExpert.id) ?? local?.id ?? '',
    name:
      text(serverExpert.name) ??
      text(serverExpert.public_name) ??
      local?.name ??
      'Pakar Budaya',
    role:
      text(serverExpert.role) ??
      text(serverExpert.title) ??
      local?.role ??
      'Pakar Budaya',
    image:
      text(serverExpert.image) ??
      text(serverExpert.image_url) ??
      local?.image ??
      '/assets/pakar-virtual/11-bli-komang.webp',
    specialties: Array.isArray(serverSpecialties)
      ? serverSpecialties.filter((item): item is string => typeof item === 'string')
      : local?.specialties ?? [],
    bio: text(serverExpert.bio) ?? local?.bio ?? '',
    gender:
      serverExpert.gender === 'wanita' || serverExpert.gender === 'pria'
        ? serverExpert.gender
        : local?.gender ?? 'pria',
    isAi:
      typeof serverExpert.isAi === 'boolean'
        ? serverExpert.isAi
        : typeof serverExpert.is_ai === 'boolean'
          ? serverExpert.is_ai
          : local?.isAi ?? true,
    suku:
      text(serverExpert.suku) ??
      text(serverExpert.community) ??
      text(serverExpert.region) ??
      local?.suku ??
      'Nusantara',
    realExpertReferences: Array.isArray(serverReferences)
      ? serverReferences as Expert[]
      : local?.realExpertReferences ?? [],
    accentHints: Array.isArray(serverAccentHints)
      ? serverAccentHints.filter((item): item is string => typeof item === 'string')
      : local?.accentHints ?? [],
    voiceName: text(serverExpert.voiceName) ?? local?.voiceName,
    languageCode:
      text(serverExpert.languageCode) ?? local?.languageCode ?? 'id-ID',
    fallbackLanguageCode:
      text(serverExpert.fallbackLanguageCode) ??
      local?.fallbackLanguageCode ??
      'id-ID',
    speakingRate:
      typeof serverExpert.speakingRate === 'number'
        ? serverExpert.speakingRate
        : local?.speakingRate ?? 1,
    pitch:
      typeof serverExpert.pitch === 'number'
        ? serverExpert.pitch
        : local?.pitch ?? 0,
    greeting: text(serverExpert.greeting) ?? local?.greeting,
  };
};
