import { type LoaderFunctionArgs } from 'react-router';
import { experts } from '../../data/experts.ts';
import { resolveExpertPersona } from '../../data/resolveExpertPersona.ts';
import network from '../../libs/network.ts';
import type { Expert } from '../../types/expert.ts';

const expertChatPageLoader = async ({
  params,
}: LoaderFunctionArgs): Promise<{
  data: Expert | undefined;
}> => {
  const { id } = params;

  if (!id) {
    return {
      data: undefined,
    };
  }

  // 1. Prioritaskan pengambilan profil pakar terkelola dari server API (/api/experts/:idOrSlug)
  try {
    const res = await network.get(`/experts/${id}`);
    if (res.data) {
      const formatted: Expert = resolveExpertPersona(res.data);
      return {
        data: formatted,
      };
    }
  } catch (err) {
    console.warn('Gagal memuat pakar dari API di expertChatPageLoader, mencoba fallback lokal:', err);
  }

  // 2. Fallback ke basis data pakar lokal (mencocokkan id, slug, atau nama)
  const normalizedId = id.toLowerCase();
  const matched = experts.find((expert) => {
    if (!expert.isAi) return false;
    if (expert.id === id) return true;
    const slug = expert.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (slug === normalizedId || expert.name.toLowerCase() === normalizedId) return true;
    return false;
  });

  const expert = matched ? { ...matched, realExpertReferences: [] } : undefined;

  return {
    data: expert,
  };
};

export default expertChatPageLoader;
