// @ts-ignore
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
}
