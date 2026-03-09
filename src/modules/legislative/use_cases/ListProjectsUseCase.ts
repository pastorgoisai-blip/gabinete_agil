import type { Project } from '../domain/entities/Project';
import type { IProjectRepository, ProjectFilters } from '../domain/repositories/IProjectRepository';

export class ListProjectsUseCase {
  constructor(private readonly projectRepository: IProjectRepository) {}

  async execute(cabinetId: string, filters?: ProjectFilters): Promise<Project[]> {
    if (!cabinetId) {
      throw new Error('Cabinet ID é obrigatório.');
    }

    return this.projectRepository.findByCabinetId(cabinetId, filters);
  }
}
