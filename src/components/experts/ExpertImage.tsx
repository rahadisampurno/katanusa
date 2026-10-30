import { useState, useMemo, type JSX, type PropsWithChildren } from 'react';
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [attemptedFallback, setAttemptedFallback] = useState(false);

  const initials = useMemo(() => {
    return name
      .split(' ')
      .map((word) => word[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [name]);

  // Mengutamakan format WebP berbobot ringan untuk memangkas ukuran unduhan hingga 85-90%
  const effectiveSrc = useMemo(() => {
    if (!image) return '';
    if (attemptedFallback) return image;
    if (image.toLowerCase().endsWith('.png')) {
      return image.replace(/\.png$/i, '.webp');
    }
    return image;
  }, [image, attemptedFallback]);

  const handleImageError = () => {
    // Jika WebP gagal dimuat dan tautan awal adalah PNG, coba unduh PNG sebelum beralih ke inisial
    if (!attemptedFallback && image && image.toLowerCase().endsWith('.png')) {
      setAttemptedFallback(true);
    } else {
      setHasError(true);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="group rounded-xl aspect-[4/3] w-full relative transition-transform duration-200 hover:scale-[1.03] cursor-pointer overflow-hidden bg-slate-800 shadow-md"
      onClick={onClick}
    >
      <ExpertBadge isAi={isAi} />

      {/* Shimmer Placeholder saat proses loading berlangsung (mencegah CLS & flickering) */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 animate-pulse" />
      )}

      {!hasError && effectiveSrc ? (
        <img
          src={effectiveSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={handleImageError}
          className={`w-full h-full object-cover rounded-xl transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-950 p-4 text-center">
          <div className="w-16 h-16 rounded-full border-2 border-amber-400/60 bg-amber-500/10 flex items-center justify-center text-white text-xl font-bold font-serif mb-2">
            {initials}
          </div>
        </div>
      )}

      {/* Gradient Overlay untuk keterbacaan tipografi nama & gelar */}
      <div className="flex flex-col gap-0.5 text-white absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent rounded-b-xl z-10 pointer-events-none">
        <h3 className="font-bold text-sm sm:text-base leading-tight truncate">{name}</h3>
        <p className="line-clamp-2 text-xs text-slate-200">{caption}</p>
      </div>
    </div>
  );
};

export default ExpertImage;
