import type React from 'react';
import {
  MandalaKawungIcon,
  PerisaiTalawangIcon,
  SuryaMajapahitIcon,
} from '../icons/NusantaraIcons';

export interface ScopedBadgesProps {
  badges?: {
    identityVerified?: boolean;
    academicVerified?: boolean;
    practitionerVerified?: boolean;
    communityValidated?: boolean;
    acceptingConsultations?: boolean;
    aiConsented?: boolean;
  };
  className?: string;
}

export const ScopedBadges: React.FC<ScopedBadgesProps> = ({ badges, className = '' }) => {
  if (!badges) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {badges.identityVerified && (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          title="Identitas legal dan domisili telah divalidasi secara resmi."
        >
          <PerisaiTalawangIcon className="w-3.5 h-3.5 text-emerald-400" />
          Identitas Terverifikasi
        </span>
      )}

      {badges.practitionerVerified && (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"
          title="Keahlian adat dan tradisi dibuktikan melalui jejak rekam terverifikasi."
        >
          <MandalaKawungIcon className="w-3.5 h-3.5 text-amber-400" />
          Praktisi Budaya
        </span>
      )}

      {badges.communityValidated && (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"
          title="Didukung oleh pengakuan komunitas adat Nusantara."
        >
          <SuryaMajapahitIcon className="w-3.5 h-3.5 text-blue-400" />
          Mandat Komunitas
        </span>
      )}

      {badges.aiConsented && (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20"
          title="Memberikan izin terkelola untuk RAG dan pelestarian pengetahuan digital."
        >
          <SuryaMajapahitIcon className="w-3.5 h-3.5 text-purple-400" />
          AI Beretika
        </span>
      )}
    </div>
  );
};

export default ScopedBadges;
