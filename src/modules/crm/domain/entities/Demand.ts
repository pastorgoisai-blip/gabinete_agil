export type DemandStatusValue = 'Pendente' | 'Em Andamento' | 'Concluída';
export type DemandPriority = 'Alta' | 'Média' | 'Baixa';

export interface Demand {
  id: string;
  title: string;
  description: string;
  beneficiary: string;
  author: string;
  category: string;
  status: DemandStatusValue;
  priority: DemandPriority;
  obs?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  assignedTo?: string;
}
