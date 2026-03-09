import type { Demand, DemandPriority } from '../domain/entities/Demand';
import type { IDemandRepository } from '../domain/repositories/IDemandRepository';
import { DemandStatus } from '../domain/value-objects/DemandStatus';

export interface CreateDemandInput {
  title: string;
  description: string;
  beneficiary: string;
  category?: string;
  priority?: DemandPriority;
  assignedTo?: string;
  createdBy?: string;
}

export class CreateDemandUseCase {
  constructor(private readonly demandRepository: IDemandRepository) {}

  async execute(cabinetId: string, input: CreateDemandInput): Promise<Demand> {
    if (!input.title.trim()) {
      throw new Error('Título da demanda é obrigatório.');
    }

    if (!input.beneficiary.trim()) {
      throw new Error('Beneficiário é obrigatório.');
    }

    const initialStatus = DemandStatus.pending();

    return this.demandRepository.save(cabinetId, {
      title: input.title.trim(),
      description: input.description,
      beneficiary: input.beneficiary.trim(),
      author: '',
      category: input.category || 'Outros',
      status: initialStatus.current,
      priority: input.priority || 'Média',
      assignedTo: input.assignedTo,
      createdBy: input.createdBy,
    });
  }
}
