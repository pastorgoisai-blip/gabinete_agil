export type MatterStatus = 'filed' | 'processing' | 'approved' | 'rejected' | 'archived';

export interface LegislativeMatter {
  id: string;
  cabinetId?: string;
  externalId?: string;
  year: number;
  number: number;
  typeAcronym: string;
  typeDescription: string;
  authors: string;
  pdfUrl?: string;
  description: string;
  status: MatterStatus;
  createdAt?: string;
}
