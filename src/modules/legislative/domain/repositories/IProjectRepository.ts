import type { Project, ProjectStatus } from '../entities/Project';

export interface ProjectFilters {
  status?: ProjectStatus;
  year?: string;
  type?: string;
}

export interface IProjectRepository {
  findById(id: string): Promise<Project | null>;
  findByCabinetId(cabinetId: string, filters?: ProjectFilters): Promise<Project[]>;
  save(cabinetId: string, project: Omit<Project, 'id' | 'createdAt'>): Promise<Project>;
  update(id: string, data: Partial<Project>): Promise<Project>;
  delete(id: string): Promise<void>;
}
