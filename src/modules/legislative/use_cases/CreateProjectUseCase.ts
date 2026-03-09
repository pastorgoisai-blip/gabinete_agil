import type { Project, ProjectStatus } from '../domain/entities/Project';
import type { IProjectRepository } from '../domain/repositories/IProjectRepository';

export interface CreateProjectInput {
  type: string;
  number: string;
  year: string;
  author: string;
  summary: string;
  status?: ProjectStatus;
  deadline?: string;
  documentUrl?: string;
}

export class CreateProjectUseCase {
  constructor(private readonly projectRepository: IProjectRepository) {}

  async execute(cabinetId: string, input: CreateProjectInput): Promise<Project> {
    if (!input.number.trim()) {
      throw new Error('Número do projeto é obrigatório.');
    }

    if (!input.author.trim()) {
      throw new Error('Autor do projeto é obrigatório.');
    }

    if (!input.summary.trim()) {
      throw new Error('Ementa do projeto é obrigatória.');
    }

    return this.projectRepository.save(cabinetId, {
      type: input.type,
      number: input.number.trim(),
      year: input.year,
      author: input.author.trim(),
      summary: input.summary.trim(),
      status: input.status || 'Em Tramitação',
      deadline: input.deadline,
      documentUrl: input.documentUrl,
    });
  }
}
