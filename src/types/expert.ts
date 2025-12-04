// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
export enum ExpertGenderEnum {
  PRIA = 'pria',
  WANITA = 'wanita',
}

export type ExpertGenderType = {
  [key in ExpertGenderEnum]: string;
};

export interface Expert {
  id: string;
  name: string;
  role: string;
  image: string;
  origin?: string;
  specialties: string[];
  bio?: string;
  experience?: string;
  gender: 'pria' | 'wanita';
  isAi?: boolean;
  articles?: string[];
  realExpertReferences?: Expert[];
  suku?: string;
  voiceName?: string;
  languageCode?: string;
  accentHints?: string[];
  speakingRate?: number;
  pitch?: number;
}
