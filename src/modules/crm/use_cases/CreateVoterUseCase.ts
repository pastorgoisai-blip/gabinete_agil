import type { Voter, VoterCategory, VoterSource } from '../domain/entities/Voter';
import type { IVoterRepository } from '../domain/repositories/IVoterRepository';
import { CPF } from '../domain/value-objects/CPF';

export interface CreateVoterInput {
  name: string;
  cpf?: string;
  phone: string;
  email?: string;
  address: string;
  city?: string;
  neighborhood?: string;
  birthDate?: string;
  category: VoterCategory;
  source?: VoterSource;
  createdBy?: string;
  indicatedBy?: string;
  tags?: string[];
}

export class CreateVoterUseCase {
  constructor(private readonly voterRepository: IVoterRepository) {}

  async execute(cabinetId: string, input: CreateVoterInput): Promise<Voter> {
    if (!input.name.trim()) {
      throw new Error('Nome do eleitor é obrigatório.');
    }

    let validatedCpf: string | undefined;
    if (input.cpf) {
      const cpf = CPF.create(input.cpf);
      validatedCpf = cpf.raw;
    }

    return this.voterRepository.save(cabinetId, {
      name: input.name.trim(),
      cpf: validatedCpf,
      phone: input.phone,
      email: input.email,
      address: input.address,
      city: input.city,
      neighborhood: input.neighborhood,
      birthDate: input.birthDate,
      category: input.category,
      status: 'active',
      source: input.source || 'Manual',
      createdBy: input.createdBy,
      indicatedBy: input.indicatedBy,
      tags: input.tags,
    });
  }
}
