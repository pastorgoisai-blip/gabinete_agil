export type OfficeStatus = 'Pendente' | 'Enviado' | 'Respondido' | 'Assinado';

export interface LegislativeOffice {
  id: string;
  cabinetId?: string;
  type?: string;
  number: string;
  year: string;
  recipient: string;
  subject: string;
  status: OfficeStatus;
  documentUrl?: string;
  contentHtml?: string;
  signedAt?: string;
  signatureHash?: string;
  createdAt?: string;
}
