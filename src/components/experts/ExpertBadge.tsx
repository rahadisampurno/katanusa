import { User, Sparkles } from 'lucide-react';
import type { JSX, PropsWithChildren } from 'react';
import { cn } from '../../libs/utils';
import type { ExpertBadgeProps } from './ExpertType';

const ExpertBadge = ({
  isAi = false,
}: PropsWithChildren<ExpertBadgeProps>): JSX.Element => {
  return (
    <div
      className={cn(
        'bg-linear-to-r absolute top-0 left-0 z-10 my-2 mx-2 from-[#00C742] to-[#007A25] flex gap-1 justify-start items-center max-w-fit p-1 rounded-lg',
        {
          'bg-linear-to-r from-blue-500 to-blue-300': isAi,
        },
      )}
    >
      {isAi ? (
        <Sparkles className="w-4 h-4 text-white" />
      ) : (
        <User className="w-4 h-4 text-white" />
      )}
      <span className="block text-white uppercase text-xs">
        {isAi ? 'Pakar Virtual' : 'Pakar Nyata'}
      </span>
    </div>
  );
};

export default ExpertBadge;
