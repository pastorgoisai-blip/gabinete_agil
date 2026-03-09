import type { LegislativeMatter, MatterStatus } from '../entities/LegislativeMatter';

export interface MatterFilters {
  status?: MatterStatus;
  year?: number;
  typeAcronym?: string;
}

export interface ILegislativeMatterRepository {
  findById(id: string): Promise<LegislativeMatter | null>;
  findByCabinetId(cabinetId: string, filters?: MatterFilters): Promise<LegislativeMatter[]>;
  save(matter: Omit<LegislativeMatter, 'id' | 'createdAt'>): Promise<LegislativeMatter>;
  saveBatch(matters: Omit<LegislativeMatter, 'id' | 'createdAt'>[]): Promise<LegislativeMatter[]>;
  update(id: string, data: Partial<LegislativeMatter>): Promise<LegislativeMatter>;
  delete(id: string): Promise<void>;
}
