export type ProjectStatus = 'Em Tramitação' | 'Finalizado' | 'Arquivado';

export interface Project {
  id: string;
  type: string;
  number: string;
  year: string;
  author: string;
  summary: string;
  status: ProjectStatus;
  deadline?: string;
  documentUrl?: string;
  createdAt?: string;
}
