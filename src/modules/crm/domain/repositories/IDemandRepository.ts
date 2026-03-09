import type { Demand, DemandStatusValue, DemandPriority } from '../entities/Demand';

export interface DemandFilters {
  search?: string;
  status?: DemandStatusValue;
  priority?: DemandPriority;
  category?: string;
  assignedTo?: string;
}

export interface IDemandRepository {
  findById(id: string): Promise<Demand | null>;
  findByCabinetId(cabinetId: string, filters?: DemandFilters): Promise<Demand[]>;
  save(cabinetId: string, demand: Omit<Demand, 'id' | 'createdAt' | 'updatedAt'>): Promise<Demand>;
  update(id: string, data: Partial<Demand>): Promise<Demand>;
  updateStatus(id: string, status: DemandStatusValue): Promise<Demand>;
  delete(id: string): Promise<void>;
  getCategories(cabinetId: string): Promise<string[]>;
  countByCabinetId(cabinetId: string): Promise<number>;
}
