import type { Cabinet } from '../domain/entities/Cabinet';
import type { ICabinetRepository } from '../domain/repositories/ICabinetRepository';

export class GetCabinetDetailsUseCase {
  constructor(private readonly cabinetRepository: ICabinetRepository) {}

  async execute(cabinetId: string): Promise<Cabinet> {
    if (!cabinetId) {
      throw new Error('Cabinet ID é obrigatório.');
    }

    const cabinet = await this.cabinetRepository.findById(cabinetId);

    if (!cabinet) {
      throw new Error(`Gabinete "${cabinetId}" não encontrado.`);
    }

    return cabinet;
  }
}
