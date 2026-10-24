import { useState, type JSX, type PropsWithChildren } from 'react';
import ExpertBadge from './ExpertBadge';
import type { ExpertImageProps } from './ExpertType';

const ExpertImage = ({
  alt,
  image,
  name,
  caption,
  isAi,
  onClick,
}: PropsWithChildren<ExpertImageProps>): JSX.Element => {
  const [hasError, setHasError] = useState(false);

  const initials = name
    .split(' ')
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      role="button"
      className="rounded-xl h-59 w-full relative hover:scale-105 transition-all cursor-pointer overflow-hidden bg-slate-800"
      onClick={onClick}
    >
      <ExpertBadge isAi={isAi} />
      {!hasError && image ? (
        <img
          src={image}
          alt={alt}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover rounded-xl"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-950 p-4 text-center">
          <div className="w-20 h-20 rounded-full border-2 border-amber-400/60 bg-amber-500/10 flex items-center justify-center text-white text-2xl font-bold font-serif mb-2">
            {initials}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-1 text-white absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-black to-transparent rounded-b-xl z-10">
        <h3 className="font-bold">{name}</h3>
        <p className="line-clamp-2 text-sm">{caption}</p>
      </div>
    </div>
  );
};

export default ExpertImage;
