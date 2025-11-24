import { type LoaderFunctionArgs } from 'react-router';
import { experts } from '../../data/experts.ts';
import type { Expert } from '../../types/expert.ts';

const expertChatPageLoader = ({
  params,
}: LoaderFunctionArgs): {
  data: Expert | undefined;
} => {
  const { id } = params;

  if (id === undefined)
    return {
      data: undefined,
    };

  const expert = experts.find((expert) => expert.id === id);

  return {
    data: expert,
  };
};

export default expertChatPageLoader;
