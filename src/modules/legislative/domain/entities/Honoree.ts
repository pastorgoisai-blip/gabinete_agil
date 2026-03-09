export type HonoreeType = 'Titulo de Cidadão Anapolino' | 'Moção de Aplauso' | 'Comenda';
export type HonoreeStatus = 'Indicado' | 'Confirmado' | 'Entregue' | 'Cancelado';

export interface Honoree {
  id: string;
  name: string;
  socialName?: string;
  type: HonoreeType;
  ceremonyDate: string;
  justification?: string;
  bio?: string;
  status: HonoreeStatus;
  phone?: string;
  email?: string;
}
