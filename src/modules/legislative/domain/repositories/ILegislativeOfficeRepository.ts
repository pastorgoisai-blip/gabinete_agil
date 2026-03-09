import type { LegislativeOffice, OfficeStatus } from '../entities/LegislativeOffice';

export interface OfficeFilters {
  status?: OfficeStatus;
  year?: string;
}

export interface ILegislativeOfficeRepository {
  findById(id: string): Promise<LegislativeOffice | null>;
  findByCabinetId(cabinetId: string, filters?: OfficeFilters): Promise<LegislativeOffice[]>;
  save(office: Omit<LegislativeOffice, 'id' | 'createdAt'>): Promise<LegislativeOffice>;
  update(id: string, data: Partial<LegislativeOffice>): Promise<LegislativeOffice>;
  delete(id: string): Promise<void>;
}
