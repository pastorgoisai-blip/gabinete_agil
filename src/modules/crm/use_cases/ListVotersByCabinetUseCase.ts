import type { Voter } from '../domain/entities/Voter';
import type { IVoterRepository, VoterFilters } from '../domain/repositories/IVoterRepository';

export class ListVotersByCabinetUseCase {
  constructor(private readonly voterRepository: IVoterRepository) {}

  async execute(cabinetId: string, filters?: VoterFilters): Promise<Voter[]> {
    if (!cabinetId) {
      throw new Error('Cabinet ID é obrigatório.');
    }

    return this.voterRepository.findByCabinetId(cabinetId, filters);
  }
}
