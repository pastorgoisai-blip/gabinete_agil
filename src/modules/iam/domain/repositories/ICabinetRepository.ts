import type { Cabinet } from '../entities/Cabinet';

export interface ICabinetRepository {
  findById(id: string): Promise<Cabinet | null>;
  findAll(): Promise<Cabinet[]>;
  save(cabinet: Omit<Cabinet, 'id' | 'createdAt'>): Promise<Cabinet>;
  update(id: string, data: Partial<Cabinet>): Promise<Cabinet>;
  delete(id: string): Promise<void>;
}
