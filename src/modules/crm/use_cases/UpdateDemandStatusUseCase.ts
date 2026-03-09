import type { Demand, DemandStatusValue } from '../domain/entities/Demand';
import type { IDemandRepository } from '../domain/repositories/IDemandRepository';
import { DemandStatus } from '../domain/value-objects/DemandStatus';

export interface UpdateDemandStatusInput {
  demandId: string;
  newStatus: DemandStatusValue;
}

export class UpdateDemandStatusUseCase {
  constructor(private readonly demandRepository: IDemandRepository) {}

  async execute(input: UpdateDemandStatusInput): Promise<Demand> {
    const demand = await this.demandRepository.findById(input.demandId);

    if (!demand) {
      throw new Error(`Demanda "${input.demandId}" não encontrada.`);
    }

    const currentStatus = DemandStatus.create(demand.status);
    currentStatus.transitionTo(input.newStatus);

    return this.demandRepository.updateStatus(input.demandId, input.newStatus);
  }
}
