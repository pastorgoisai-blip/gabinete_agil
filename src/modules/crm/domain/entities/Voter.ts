export type VoterCategory = 'Liderança' | 'Apoiador' | 'Voluntário' | 'Indeciso';
export type VoterStatus = 'active' | 'inactive';
export type VoterSource = 'Manual' | 'Auto-cadastro' | 'Importação';

export interface Voter {
  id: string;
  name: string;
  cpf?: string;
  phone: string;
  email?: string;
  address: string;
  city?: string;
  neighborhood?: string;
  birthDate?: string;
  category: VoterCategory;
  status: VoterStatus;
  source?: VoterSource;
  createdBy?: string;
  indicatedBy?: string;
  avatarUrl?: string;
  tags?: string[];
}
