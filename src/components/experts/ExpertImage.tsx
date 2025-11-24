import type { JSX, PropsWithChildren } from 'react';
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
  return (
    <div
      role="button"
      className="rounded-xl h-59 w-full relative hover:scale-105 transition-all cursor-pointer"
      onClick={onClick}
    >
      <ExpertBadge isAi={isAi} />
      <img
        src={image}
        alt={alt}
        className="w-full h-full object-cover rounded-xl"
      />
      <div className="flex flex-col gap-1 text-white absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-black to-transparent rounded-b-xl">
        <h3 className="font-bold">{name}</h3>
        <p className="line-clamp-2 text-sm">{caption}</p>
      </div>
    </div>
  );
};

export default ExpertImage;
