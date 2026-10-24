export type Capability =
  | 'user'
  | 'expert_verified'
  | 'credential_reviewer'
  | 'cultural_reviewer'
  | 'support'
  | 'admin'
  | 'security_admin';

export type UserDataType = {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string | null;
  role: 'umum' | 'pakar' | 'admin';
  capabilities?: Capability[];
  assuranceLevel?: 'AAL1' | 'AAL2' | 'AAL3';
  user_metadata?: {
    name?: string;
    avatar_url?: string | null;
    role?: 'umum' | 'pakar' | 'admin';
    scientificWorkLink?: string;
    phone?: string;
  };
};

export type SessionResponse = {
  user: UserDataType;
  expertProfile?: {
    id: string;
    slug: string;
    public_name: string;
    status: string;
    is_published: boolean;
  } | null;
  pendingApplication?: {
    id: string;
    stage: number;
    status: string;
    updated_at: string;
  } | null;
};
