import type React from 'react';

export interface NusantaraIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

/**
 * Surya Majapahit (Cakra Kearifan Nusantara)
 * Pengganti ikon generic "Sparkles / AI AI default".
 * Terinspirasi dari lambang surya berkepala delapan khas peradaban Nusantara / Majapahit,
 * melambangkan kebijaksanaan, kearifan leluhur, kecerdasan budi, dan pencerahan.
 */
export const SuryaMajapahitIcon: React.FC<NusantaraIconProps> = ({
  className = 'w-4 h-4',
  size,
  ...props
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
      {...props}
    >
      {/* Inti Surya (Bunga Teratai / Pusat Kearifan) */}
      <circle cx="12" cy="12" r="2.5" fill="currentColor" fillOpacity="0.25" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />

      {/* 4 Pancaran Utama (Kardinal: Utara, Timur, Selatan, Barat) berbentuk lidah api pusaka */}
      <path d="M12 2 L13.2 6.2 C12.8 7 12 7.5 12 7.5 C12 7.5 11.2 7 10.8 6.2 Z" fill="currentColor" />
      <path d="M12 22 L13.2 17.8 C12.8 17 12 16.5 12 16.5 C12 16.5 11.2 17 10.8 17.8 Z" fill="currentColor" />
      <path d="M22 12 L17.8 13.2 C17 12.8 16.5 12 16.5 12 C16.5 12 17 11.2 17.8 10.8 Z" fill="currentColor" />
      <path d="M2 12 L6.2 13.2 C7 12.8 7.5 12 7.5 12 C7.5 12 7 11.2 6.2 10.8 Z" fill="currentColor" />

      {/* 4 Pancaran Diagonal (Sudut Arah Angin) berhias ornamen api */}
      <path d="M19.07 4.93 L16.2 7.8 C15.8 7.2 15 7.2 15 7.2 C15 7.2 15 8 15.6 8.4 Z" fill="currentColor" />
      <path d="M4.93 19.07 L7.8 16.2 C7.2 15.8 7.2 15 7.2 15 C7.2 15 8 15 8.4 15.6 Z" fill="currentColor" />
      <path d="M19.07 19.07 L16.2 16.2 C15.8 16.8 15 16.8 15 16.8 C15 16.8 15 16 15.6 15.6 Z" fill="currentColor" />
      <path d="M4.93 4.93 L7.8 7.8 C7.2 8.2 7.2 9 7.2 9 C7.2 9 8 9 8.4 8.4 Z" fill="currentColor" />

      {/* Cincin Harmoni Lingkaran Budaya */}
      <circle cx="12" cy="12" r="5" strokeDasharray="1.5 2" strokeWidth="1.2" opacity="0.8" />
    </svg>
  );
};

/**
 * Mandala Kawung (Ekosistem Budaya & Rajutan Nusantara)
 * Pengganti ikon generic "Globe / Globe wireframe".
 * Menggunakan motif geometris tertua Nusantara (Batik Kawung),
 * melambangkan persatuan 4 penjuru angin nusantara, keseimbangan manusia, alam, dan ekosistem kebudayaan.
 */
export const MandalaKawungIcon: React.FC<NusantaraIconProps> = ({
  className = 'w-4 h-4',
  size,
  ...props
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
      {...props}
    >
      {/* Lingkaran Luar Perlindungan Tradisi */}
      <circle cx="12" cy="12" r="9.5" strokeWidth="1.4" opacity="0.6" />

      {/* 4 Kelopak Kawung yang Saling Berkait */}
      <path
        d="M12 2.5 C14.5 5.5 15.5 8.5 15.5 12 C15.5 15.5 14.5 18.5 12 21.5 C9.5 18.5 8.5 15.5 8.5 12 C8.5 8.5 9.5 5.5 12 2.5 Z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path
        d="M2.5 12 C5.5 14.5 8.5 15.5 12 15.5 C15.5 15.5 18.5 14.5 21.5 12 C18.5 9.5 15.5 8.5 12 8.5 C8.5 8.5 5.5 9.5 2.5 12 Z"
        fill="currentColor"
        fillOpacity="0.15"
      />

      {/* Inti Berlian (Cakra Sumbu) */}
      <polygon points="12,9.5 14.5,12 12,14.5 9.5,12" fill="currentColor" />

      {/* 4 Titik Isen-Isen Khas Batik Tradisional */}
      <circle cx="6.5" cy="6.5" r="0.9" fill="currentColor" />
      <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" />
      <circle cx="6.5" cy="17.5" r="0.9" fill="currentColor" />
      <circle cx="17.5" cy="17.5" r="0.9" fill="currentColor" />
    </svg>
  );
};

/**
 * Perisai Talawang / Salawaku (Keamanan & Benteng Kebudayaan)
 * Pengganti ikon generic "ShieldCheck / Antivirus shield".
 * Mengadaptasi bentuk perisai tradisional Dayak (Talawang) & Maluku (Salawaku),
 * dengan ukiran sulur paku dan ornamen pertahanan sakral untuk validasi pakar dan enkripsi etis.
 */
export const PerisaiTalawangIcon: React.FC<NusantaraIconProps> = ({
  className = 'w-4 h-4',
  size,
  ...props
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
      {...props}
    >
      {/* Kontur Khas Perisai Talawang Nusantara (Ramping bersudut khas) */}
      <path
        d="M12 2 L18.5 6 C18.5 11.5 17 17 12 22 C7 17 5.5 11.5 5.5 6 L12 2 Z"
        fill="currentColor"
        fillOpacity="0.18"
      />

      {/* Garis Tulang Punggung Perisai */}
      <line x1="12" y1="2" x2="12" y2="22" strokeWidth="1.2" opacity="0.7" />

      {/* Ornamen Ukir Kalung / Ciri Khas Dayak di dalam perisai */}
      <path d="M12 6 L15 9 L12 12 L9 9 Z" fill="currentColor" fillOpacity="0.3" strokeWidth="1.2" />
      <path d="M12 13 L14.5 15.5 L12 18 L9.5 15.5 Z" fill="currentColor" fillOpacity="0.3" strokeWidth="1.2" />

      {/* Tanda Centang Otentisitas Terintegrasi dengan Ukiran Tradisi */}
      <path d="M9.5 11.5 L11.2 13.2 L15 9" strokeWidth="1.8" stroke="currentColor" />
    </svg>
  );
};

/**
 * Gunungan Wayang (Kayon / Pintu Gerbang Percakapan Budaya)
 * Simbol semesta, awal mulanya lakon tutur cerita, pembuka kearifan Nusantara.
 */
export const GununganWayangIcon: React.FC<NusantaraIconProps> = ({
  className = 'w-4 h-4',
  size,
  ...props
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
      {...props}
    >
      {/* Kontur Luar Gunungan / Kayon */}
      <path
        d="M12 2 C13 5 18.5 9.5 18.5 15 C18.5 18.5 15.5 20.5 12 20.5 C8.5 20.5 5.5 18.5 5.5 15 C5.5 9.5 11 5 12 2 Z"
        fill="currentColor"
        fillOpacity="0.15"
      />

      {/* Batang / Gagang Cempurit Kayon */}
      <line x1="12" y1="20.5" x2="12" y2="23" strokeWidth="2" />

      {/* Pohon Hayat / Kalpataru & Cabang Tradisi */}
      <line x1="12" y1="6" x2="12" y2="17" strokeWidth="1.2" />
      <path d="M12 10 Q15 8 16 11" strokeWidth="1.2" />
      <path d="M12 10 Q9 8 8 11" strokeWidth="1.2" />
      <path d="M12 13 Q15 11.5 16 14" strokeWidth="1.2" />
      <path d="M12 13 Q9 11.5 8 14" strokeWidth="1.2" />

      {/* Gerbang Paduraksa (Gapura Bawah) */}
      <rect x="10" y="17" width="4" height="3.5" rx="0.5" fill="currentColor" fillOpacity="0.4" />
    </svg>
  );
};

/**
 * Bunga Melati / Puspa Bangsa (Kebaikan & Pelestarian Tradisi)
 * Pengganti ikon generic "Heart" atau aksen dedikasi,
 * melambangkan ketulusan hati para penjaga tradisi Nusantara.
 */
export const BungaMelatiIcon: React.FC<NusantaraIconProps> = ({
  className = 'w-4 h-4',
  size,
  ...props
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
      {...props}
    >
      {/* 5 Kelopak Bunga Melati (Puspa Bangsa) */}
      <path d="M12 6 C12 3.5 13 2 14 3 C15 4 14 6 12 6 Z" fill="currentColor" />
      <path d="M15.8 8.8 C18.2 7.8 19.5 8.2 19 9.5 C18.5 10.8 16.5 10.2 15.8 8.8 Z" fill="currentColor" />
      <path d="M14.4 14.2 C16 16 16.2 17.5 15 18 C13.8 18.5 13 16.5 14.4 14.2 Z" fill="currentColor" />
      <path d="M9.6 14.2 C8.2 16.5 7.4 18.5 6.2 18 C5 17.5 5.2 16 6.8 14.2 Z" fill="currentColor" />
      <path d="M8.2 8.8 C7.5 10.2 5.5 10.8 5 9.5 C4.5 8.2 5.8 7.8 8.2 8.8 Z" fill="currentColor" />

      {/* Inti Bunga */}
      <circle cx="12" cy="11.5" r="2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="11.5" r="3.5" strokeWidth="1" strokeDasharray="1.5 1.5" opacity="0.6" />
    </svg>
  );
};
